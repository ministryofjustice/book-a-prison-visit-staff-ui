import { RequestHandler, Request, Router, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'
import { BadRequest, NotFound } from 'http-errors'
import visitCancellationReasons from '../constants/visitCancellationReasons'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import { OutcomeDto, Visit } from '../data/visitSchedulerApiTypes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import AuditService from '../services/auditService'
import { isValidVisitReference } from './validationChecks'
import { clearSession, getFlashFormValues } from './visitorUtils'
import NotificationsService from '../services/notificationsService'
import config from '../config'
import logger from '../../logger'
import { VisitorListItem, VisitSessionData } from '../@types/bapv'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import SelectVisitors from './visitJourney/selectVisitors'
import PrisonerProfileService from '../services/prisonerProfileService'
import VisitType from './visitJourney/visitType'
import { properCaseFullName } from '../utils/utils'
import DateAndTime from './visitJourney/dateAndTime'
import AdditionalSupport from './visitJourney/additionalSupport'
import CheckYourBooking from './visitJourney/checkYourBooking'
import Confirmation from './visitJourney/confirmation'
import MainContact from './visitJourney/mainContact'

export default function routes(
  router: Router,
  prisonerSearchService: PrisonerSearchService,
  visitSessionsService: VisitSessionsService,
  notificationsService: NotificationsService,
  auditService: AuditService,
  prisonerVisitorsService: PrisonerVisitorsService,
  prisonerProfileService: PrisonerProfileService,
): Router {
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

    const {
      visit,
      visitors,
      additionalSupport,
    }: { visit: Visit; visitors: VisitorListItem[]; additionalSupport: string[] } =
      await visitSessionsService.getFullVisitDetails({
        reference,
        username: res.locals.user?.username,
      })

    const prisoner: Prisoner = await prisonerSearchService.getPrisonerById(visit.prisonerId, res.locals.user?.username)
    // Temporarily hide any locations other than Hewell pending more work on transfer/release (see VB-907, VB-952)
    const prisonerLocation =
      prisoner.prisonId === 'HEI' ? `${prisoner.cellLocation}, ${prisoner.prisonName}` : 'Unknown'

    await auditService.viewedVisitDetails({
      visitReference: reference,
      prisonerId: visit.prisonerId,
      prisonId: visit.prisonId,
      username: res.locals.user?.username,
      operationId: res.locals.appInsightsOperationId,
    })

    const visitorIds = visit.visitors.flatMap(visitor => visitor.nomisPersonId)
    const mainContactVisitor = visit.visitors.find(visitor => visitor.visitContact)
    const mainContactId = mainContactVisitor ? mainContactVisitor.nomisPersonId : null
    const visitorList = await prisonerVisitorsService.getVisitors(visit.prisonerId, res.locals.user?.username)
    const currentVisitors = visitorList.filter(visitor => visitorIds.includes(visitor.personId))
    const mainContact = currentVisitors.find(visitor => visitor.personId === mainContactId)

    // clean then load session
    clearSession(req)
    const visitSessionData: VisitSessionData = {
      prisoner: {
        name: properCaseFullName(`${prisoner.lastName}, ${prisoner.firstName}`),
        offenderNo: prisoner.prisonerNumber,
        dateOfBirth: prisoner.dateOfBirth,
        location: prisonerLocation,
      },
      visit: {
        id: '',
        startTimestamp: visit.startTimestamp,
        endTimestamp: visit.endTimestamp,
        availableTables: 0,
        capacity: undefined,
        visitRoomName: visit.visitRoom,
        visitRestriction: visit.visitRestriction,
      },
      visitRestriction: visit.visitRestriction,
      visitors: currentVisitors,
      visitorSupport: visit.visitorSupport,
      mainContact: {
        contact: mainContact,
        phoneNumber: visit.visitContact.telephone,
        contactName: visit.visitContact.name,
      },
      visitStatus: visit.visitStatus,
      // reference of visit to be updated - as updated visit will get a new reference
      previousVisitReference: visit.reference,
    }

    req.session.visitSessionData = Object.assign(req.session.visitSessionData ?? {}, visitSessionData)

    return res.render('pages/visit/summary', {
      prisoner,
      prisonerLocation,
      visit,
      visitors,
      additionalSupport,
      fromVisitSearch,
      fromVisitSearchQuery,
      updateJourneyEnabled: config.features.updateJourneyEnabled,
    })
  })

  const selectVisitors = new SelectVisitors('update', prisonerVisitorsService, prisonerProfileService)
  const visitType = new VisitType('update', auditService)
  const dateAndTime = new DateAndTime('update', visitSessionsService, auditService)
  const additionalSupport = new AdditionalSupport('update', visitSessionsService)
  const mainContact = new MainContact('update')
  const checkYourBooking = new CheckYourBooking('update', visitSessionsService, auditService, notificationsService)
  const confirmation = new Confirmation('update')

  get('/:reference/update/select-visitors', updateJourneyCheckMiddleware, checkVisitReferenceMiddleware, (req, res) =>
    selectVisitors.get(req, res),
  )
  post(
    '/:reference/update/select-visitors',
    updateJourneyCheckMiddleware,
    checkVisitReferenceMiddleware,
    selectVisitors.validate(),
    (req, res) => selectVisitors.post(req, res),
  )

  get('/:reference/update/visit-type', updateJourneyCheckMiddleware, checkVisitReferenceMiddleware, (req, res) =>
    visitType.get(req, res),
  )
  post(
    '/:reference/update/visit-type',
    updateJourneyCheckMiddleware,
    checkVisitReferenceMiddleware,
    visitType.validate(),
    (req, res) => visitType.post(req, res),
  )

  get(
    '/:reference/update/select-date-and-time',
    updateJourneyCheckMiddleware,
    checkVisitReferenceMiddleware,
    ...dateAndTime.validateGet(),
    (req, res) => dateAndTime.get(req, res),
  )
  post(
    '/:reference/update/select-date-and-time',
    updateJourneyCheckMiddleware,
    checkVisitReferenceMiddleware,
    dateAndTime.validate(),
    (req, res) => dateAndTime.post(req, res),
  )

  get(
    '/:reference/update/additional-support',
    updateJourneyCheckMiddleware,
    checkVisitReferenceMiddleware,
    (req, res) => additionalSupport.get(req, res),
  )
  post(
    '/:reference/update/additional-support',
    updateJourneyCheckMiddleware,
    checkVisitReferenceMiddleware,
    ...additionalSupport.validate(),
    (req, res) => additionalSupport.post(req, res),
  )

  get(
    '/:reference/update/select-main-contact',
    updateJourneyCheckMiddleware,
    checkVisitReferenceMiddleware,
    (req, res) => mainContact.get(req, res),
  )
  post(
    '/:reference/update/select-main-contact',
    updateJourneyCheckMiddleware,
    checkVisitReferenceMiddleware,
    ...mainContact.validate(),
    (req, res) => mainContact.post(req, res),
  )

  get(
    '/:reference/update/check-your-booking',
    updateJourneyCheckMiddleware,
    checkVisitReferenceMiddleware,
    (req, res) => checkYourBooking.get(req, res),
  )
  post(
    '/:reference/update/check-your-booking',
    updateJourneyCheckMiddleware,
    checkVisitReferenceMiddleware,
    (req, res) => checkYourBooking.post(req, res),
  )

  get('/:reference/update/confirmation', updateJourneyCheckMiddleware, (req, res) => confirmation.get(req, res))

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

      await auditService.cancelledVisit({
        visitReference: reference,
        prisonerId: visit.prisonerId.toString(),
        reason: `${req.body.cancel}: ${req.body[reasonFieldName]}`,
        username: res.locals.user?.username,
        operationId: res.locals.appInsightsOperationId,
      })

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

const checkVisitReferenceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { reference } = req.params

  if (!isValidVisitReference(reference)) {
    throw new BadRequest()
  }

  next()
}

const updateJourneyCheckMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { updateJourneyEnabled } = config.features

  if (!updateJourneyEnabled) {
    throw new NotFound()
  }

  next()
}
