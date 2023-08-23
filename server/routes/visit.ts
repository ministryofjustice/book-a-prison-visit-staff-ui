import type { NextFunction, RequestHandler, Request, Response } from 'express'
import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { BadRequest } from 'http-errors'
import visitCancellationReasons from '../constants/visitCancellationReasons'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import { CancelVisitOrchestrationDto } from '../data/orchestrationApiTypes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { isValidVisitReference } from './validationChecks'
import { clearSession, getFlashFormValues } from './visitorUtils'
import config from '../config'
import logger from '../../logger'
import { VisitSessionData, VisitSlot } from '../@types/bapv'
import SelectVisitors from './visitJourney/selectVisitors'
import VisitType from './visitJourney/visitType'
import { properCaseFullName } from '../utils/utils'
import DateAndTime from './visitJourney/dateAndTime'
import AdditionalSupport from './visitJourney/additionalSupport'
import CheckYourBooking from './visitJourney/checkYourBooking'
import Confirmation from './visitJourney/confirmation'
import MainContact from './visitJourney/mainContact'
import RequestMethod from './visitJourney/requestMethod'
import sessionCheckMiddleware from '../middleware/sessionCheckMiddleware'
import getPrisonConfiguration from '../constants/prisonConfiguration'
import type { Services } from '../services'
import eventAuditTypes from '../constants/eventAuditTypes'
import { requestMethodDescriptions, requestMethodOptions } from '../constants/requestMethods'

export default function routes({
  additionalSupportService,
  auditService,
  notificationsService,
  prisonerProfileService,
  prisonerSearchService,
  prisonerVisitorsService,
  supportedPrisonsService,
  visitService,
  visitSessionsService,
}: Services): Router {
  const router = Router()

  const get = (path: string, ...handlers: RequestHandler[]) =>
    router.get(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )

  const post = (path: string, ...handlers: RequestHandler[]) =>
    router.post(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )

  get('/cancelled', async (req, res) => {
    clearSession(req)

    return res.render('pages/visit/cancelConfirmation', {
      startTimestamp: req.flash('startTimestamp')?.[0],
      endTimestamp: req.flash('endTimestamp')?.[0],
    })
  })

  get('/:reference', async (req, res) => {
    const reference = getVisitReference(req)
    const fromVisitSearch = (req.query?.from as string) === 'visit-search'
    const fromVisitSearchQuery = req.query?.query as string
    const selectedTab = req.query?.tab as string

    const { visitHistoryDetails, visitors, additionalSupport } = await visitService.getFullVisitDetails({
      reference,
      username: res.locals.user.username,
    })
    const { visit } = visitHistoryDetails

    if (visit.prisonId !== req.session.selectedEstablishment.prisonId) {
      const supportedPrisons = await supportedPrisonsService.getSupportedPrisons(res.locals.user.username)

      return res.render('pages/visit/summary', {
        visit: { reference: visit.reference },
        visitPrisonName: supportedPrisons[visit.prisonId],
        selectedTab,
      })
    }

    const prisoner: Prisoner = await prisonerSearchService.getPrisonerById(visit.prisonerId, res.locals.user.username)
    const supportedPrisonIds = await supportedPrisonsService.getSupportedPrisonIds(res.locals.user.username)

    const prisonerLocation = getPrisonerLocation(supportedPrisonIds, prisoner)

    await auditService.viewedVisitDetails({
      visitReference: reference,
      prisonerId: visit.prisonerId,
      prisonId: visit.prisonId,
      username: res.locals.user.username,
      operationId: res.locals.appInsightsOperationId,
    })

    const nowTimestamp = new Date()
    const visitStartTimestamp = new Date(visit.startTimestamp)
    const showButtons = nowTimestamp < visitStartTimestamp

    return res.render('pages/visit/summary', {
      prisoner,
      prisonerLocation,
      visit,
      visitHistoryDetails,
      visitors,
      additionalSupport,
      fromVisitSearch,
      fromVisitSearchQuery,
      showButtons,
      eventAuditTypes,
      requestMethodDescriptions,
      selectedTab,
    })
  })

  post('/:reference', async (req, res) => {
    const reference = getVisitReference(req)

    // @TODO - not really using full visit details here so could request less information
    const {
      visitHistoryDetails: { visit },
    } = await visitService.getFullVisitDetails({
      reference,
      username: res.locals.user.username,
    })

    if (visit.prisonId !== req.session.selectedEstablishment.prisonId) {
      return res.redirect(`/visit/${visit.reference}`)
    }

    const prisoner: Prisoner = await prisonerSearchService.getPrisonerById(visit.prisonerId, res.locals.user.username)
    const supportedPrisonIds = await supportedPrisonsService.getSupportedPrisonIds(res.locals.user.username)

    const prisonerLocation = getPrisonerLocation(supportedPrisonIds, prisoner)

    const visitorIds = visit.visitors.flatMap(visitor => visitor.nomisPersonId)
    const mainContactVisitor = visit.visitors.find(visitor => visitor.visitContact)
    const mainContactId = mainContactVisitor ? mainContactVisitor.nomisPersonId : null
    const visitorList = await prisonerVisitorsService.getVisitors(visit.prisonerId, res.locals.user.username)
    const currentVisitors = visitorList.filter(visitor => visitorIds.includes(visitor.personId))
    const mainContact = currentVisitors.find(visitor => visitor.personId === mainContactId)

    // clean then load session
    clearSession(req)
    const visitRestriction =
      visit.visitRestriction === 'OPEN' || visit.visitRestriction === 'CLOSED' ? visit.visitRestriction : undefined
    const visitSlot: VisitSlot = {
      id: '',
      sessionTemplateReference: visit.sessionTemplateReference,
      prisonId: visit.prisonId,
      startTimestamp: visit.startTimestamp,
      endTimestamp: visit.endTimestamp,
      availableTables: 0,
      capacity: undefined,
      visitRoom: visit.visitRoom,
      visitRestriction,
    }
    const visitSessionData: VisitSessionData = {
      prisoner: {
        name: properCaseFullName(`${prisoner.lastName}, ${prisoner.firstName}`),
        offenderNo: prisoner.prisonerNumber,
        dateOfBirth: prisoner.dateOfBirth,
        location: prisonerLocation,
      },
      visitSlot,
      originalVisitSlot: visitSlot,
      visitRestriction,
      visitors: currentVisitors,
      visitorSupport: visit.visitorSupport,
      mainContact: {
        contact: mainContact,
        phoneNumber: visit.visitContact.telephone,
        contactName: visit.visitContact.name,
      },
      visitReference: visit.reference,
      visitStatus: visit.visitStatus,
      requestMethod: undefined, // request method should NOT be pre-populated
    }

    req.session.visitSessionData = Object.assign(req.session.visitSessionData ?? {}, visitSessionData)

    return res.redirect(`/visit/${reference}/update/select-visitors`)
  })

  const selectVisitors = new SelectVisitors('update', prisonerVisitorsService, prisonerProfileService)
  const visitType = new VisitType('update', auditService)
  const dateAndTime = new DateAndTime('update', visitService, visitSessionsService, auditService)
  const additionalSupport = new AdditionalSupport('update', additionalSupportService)
  const mainContact = new MainContact('update')
  const requestMethod = new RequestMethod('update')
  const checkYourBooking = new CheckYourBooking('update', auditService, notificationsService, visitService)
  const confirmation = new Confirmation('update')

  get(
    '/:reference/update/select-visitors',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 1 }),
    (req, res) => selectVisitors.get(req, res),
  )
  post(
    '/:reference/update/select-visitors',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 1 }),
    selectVisitors.validate(),
    (req, res) => selectVisitors.post(req, res),
  )

  get(
    '/:reference/update/visit-type',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    (req, res) => visitType.get(req, res),
  )
  post(
    '/:reference/update/visit-type',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    visitType.validate(),
    (req, res) => visitType.post(req, res),
  )

  get(
    '/:reference/update/select-date-and-time',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    (req, res) => dateAndTime.get(req, res),
  )
  post(
    '/:reference/update/select-date-and-time',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    dateAndTime.validate(),
    (req, res) => dateAndTime.post(req, res),
  )

  get(
    '/:reference/update/additional-support',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 3 }),
    (req, res) => additionalSupport.get(req, res),
  )
  post(
    '/:reference/update/additional-support',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 3 }),
    ...additionalSupport.validate(),
    (req, res) => additionalSupport.post(req, res),
  )

  get(
    '/:reference/update/select-main-contact',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 4 }),
    (req, res) => mainContact.get(req, res),
  )
  post(
    '/:reference/update/select-main-contact',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 4 }),
    ...mainContact.validate(),
    (req, res) => mainContact.post(req, res),
  )

  get(
    '/:reference/update/request-method',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 5 }),
    (req, res) => requestMethod.get(req, res),
  )
  post(
    '/:reference/update/request-method',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 5 }),
    ...requestMethod.validate(),
    (req, res) => requestMethod.post(req, res),
  )

  get(
    '/:reference/update/check-your-booking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 6 }),
    (req, res) => checkYourBooking.get(req, res),
  )
  post(
    '/:reference/update/check-your-booking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 6 }),
    (req, res) => checkYourBooking.post(req, res),
  )

  get(
    '/:reference/update/confirmation',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 7 }),
    (req, res) => confirmation.get(req, res),
  )

  get('/:reference/cancel', async (req, res) => {
    const reference = getVisitReference(req)

    return res.render('pages/visit/cancel', {
      errors: req.flash('errors'),
      reference,
      visitCancellationReasons,
      requestMethodOptions,
      formValues: getFlashFormValues(req),
    })
  })

  post(
    '/:reference/cancel',
    body('cancel', 'No answer selected').isIn(Object.keys(visitCancellationReasons)),
    body('method', 'No request method selected')
      .if(body('cancel').equals('VISITOR_CANCELLED'))
      .isIn(Object.keys(requestMethodOptions)),
    body('reason', 'Enter a reason for the cancellation').trim().notEmpty(),
    async (req, res) => {
      const errors = validationResult(req)
      const reference = getVisitReference(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array() as [])
        req.flash('formValues', req.body)
        return res.redirect(`/visit/${reference}/cancel`)
      }

      const outcomeStatus = req.body.cancel
      const text = req.body.reason
      const applicationMethodType = outcomeStatus === 'VISITOR_CANCELLED' ? req.body.method : 'NOT_APPLICABLE'

      const cancelVisitDto: CancelVisitOrchestrationDto = {
        cancelOutcome: {
          outcomeStatus,
          text,
        },
        applicationMethodType,
      }

      const visit = await visitService.cancelVisit({
        username: res.locals.user.username,
        reference,
        cancelVisitDto,
      })

      await auditService.cancelledVisit({
        visitReference: reference,
        prisonerId: visit.prisonerId.toString(),
        prisonId: visit.prisonId,
        reason: `${req.body.cancel}: ${req.body.reason}`,
        username: res.locals.user.username,
        operationId: res.locals.appInsightsOperationId,
      })

      if (config.apis.notifications.enabled) {
        try {
          const phoneNumber = visit.visitContact.telephone.replace(/\s/g, '')

          const supportedPrisons = await supportedPrisonsService.getSupportedPrisons(res.locals.user.username)
          const prisonName = supportedPrisons[visit.prisonId]

          const { prisonPhoneNumber } = getPrisonConfiguration(visit.prisonId)

          await notificationsService.sendCancellationSms({
            phoneNumber,
            visitSlot: visit.startTimestamp,
            prisonName,
            prisonPhoneNumber,
            reference,
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

function getPrisonerLocation(supportedPrisonIds: string[], prisoner: Prisoner) {
  return supportedPrisonIds.includes(prisoner.prisonId) ? `${prisoner.cellLocation}, ${prisoner.prisonName}` : 'Unknown'
}

const checkVisitReferenceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { reference } = req.params

  if (!isValidVisitReference(reference)) {
    throw new BadRequest()
  }

  next()
}
