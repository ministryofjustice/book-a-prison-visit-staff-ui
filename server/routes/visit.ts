import type { RequestHandler, Request, Router } from 'express'
import { body, validationResult } from 'express-validator'
import { BadRequest } from 'http-errors'
import visitCancellationReasons from '../constants/visitCancellationReasons'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import { OutcomeDto } from '../data/visitSchedulerApiTypes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import AuditService from '../services/auditService'
import { isValidVisitReference } from './validationChecks'
import { getFlashFormValues } from './visitorUtils'
import NotificationsService from '../services/notificationsService'
import config from '../config'
import logger from '../../logger'

export default function routes(
  router: Router,
  prisonerSearchService: PrisonerSearchService,
  visitSessionsService: VisitSessionsService,
  notificationsService: NotificationsService,
  auditService: AuditService,
): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, ...handlers: RequestHandler[]) =>
    router.post(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )

  get('/cancelled', async (req, res) => {
    return res.render('pages/visit/cancelConfirmation', {
      startTimestamp: req.flash('startTimestamp')?.[0],
      endTimestamp: req.flash('endTimestamp')?.[0],
    })
  })

  get('/:reference', async (req, res) => {
    const reference = getVisitReference(req)
    const fromVisitSearch = (req.query?.from as string) === 'visit-search'
    const fromVisitSearchQuery = req.query?.query as string

    const { visit, visitors, additionalSupport } = await visitSessionsService.getFullVisitDetails({
      reference,
      username: res.locals.user?.username,
    })

    const prisoner: Prisoner = await prisonerSearchService.getPrisonerById(visit.prisonerId, res.locals.user?.username)
    // Temporarily hide any locations other than Hewell pending more work on transfer/release (see VB-907, VB-952)
    const prisonerLocation =
      prisoner.prisonId === 'HEI' ? `${prisoner.cellLocation}, ${prisoner.prisonName}` : 'Unknown'

    await auditService.viewedVisitDetails(
      reference,
      visit.prisonerId,
      visit.prisonId,
      res.locals.user?.username,
      res.locals.appInsightsOperationId,
    )

    return res.render('pages/visit/summary', {
      prisoner,
      prisonerLocation,
      visit,
      visitors,
      additionalSupport,
      fromVisitSearch,
      fromVisitSearchQuery,
    })
  })

  get('/:reference/cancel', async (req, res) => {
    const reference = getVisitReference(req)

    return res.render('pages/visit/cancel', {
      errors: req.flash('errors'),
      reference,
      visitCancellationReasons,
      formValues: getFlashFormValues(req),
    })
  })

  post(
    '/:reference/cancel',
    body('cancel').isIn(Object.keys(visitCancellationReasons)).withMessage('No answer selected'),
    async (req, res) => {
      const reasonFieldName = `reason_${req.body.cancel}`.toLowerCase()
      if (validationResult(req).isEmpty()) {
        await body(reasonFieldName).notEmpty().withMessage('Enter a reason for the cancellation').run(req)
      }

      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array() as [])
        req.flash('formValues', req.body)
        return res.redirect(req.originalUrl)
      }

      const reference = getVisitReference(req)
      const outcome: OutcomeDto = {
        outcomeStatus: req.body.cancel,
        text: req.body[reasonFieldName],
      }

      const visit = await visitSessionsService.cancelVisit({ username: res.locals.user?.username, reference, outcome })

      await auditService.cancelledVisit(
        reference,
        visit.prisonerId.toString(),
        'HEI',
        `${req.body.cancel}: ${req.body[reasonFieldName]}`,
        res.locals.user?.username,
        res.locals.appInsightsOperationId,
      )

      if (config.apis.notifications.enabled) {
        try {
          const phoneNumber = visit.visitContact.telephone.replace(/\s/g, '')

          await notificationsService.sendCancellationSms({
            phoneNumber,
            visit: visit.startTimestamp,
            prisonName: 'Hewell (HMP)',
            prisonPhoneNumber: '01234443225',
          })
          logger.info(`Cancellation SMS sent for ${reference}`)
        } catch (error) {
          logger.error(`Failed to send Cancellation SMS for ${reference}`)
        }
      }

      req.flash('startTimestamp', visit.startTimestamp)
      req.flash('endTimestamp', visit.endTimestamp)

      return res.redirect('/visit/cancelled')
    },
  )

  return router
}

function getVisitReference(req: Request): string {
  const { reference } = req.params

  if (!isValidVisitReference(reference)) {
    throw new BadRequest()
  }
  return reference
}
