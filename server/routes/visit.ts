import type { NextFunction, RequestHandler, Request, Response } from 'express'
import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { differenceInCalendarDays } from 'date-fns'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { isValidVisitReference } from './validationChecks'
import { clearSession } from './visitorUtils'
import { VisitSessionData, VisitSlot } from '../@types/bapv'
import SelectVisitors from './visitJourney/selectVisitors'
import VisitType from './visitJourney/visitType'
import { properCaseFullName, sortItemsByDateAsc } from '../utils/utils'
import DateAndTime from './visitJourney/dateAndTime'
import AdditionalSupport from './visitJourney/additionalSupport'
import CheckYourBooking from './visitJourney/checkYourBooking'
import Confirmation from './visitJourney/confirmation'
import MainContact from './visitJourney/mainContact'
import RequestMethod from './visitJourney/requestMethod'
import sessionCheckMiddleware from '../middleware/sessionCheckMiddleware'
import { type Services } from '../services'
import Overbooking from './visitJourney/overbooking'
import { Alert } from '../data/orchestrationApiTypes'
import { OffenderRestriction } from '../data/prisonApiTypes'

export default function routes({
  auditService,
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

  post('/:reference', async (req, res) => {
    const reference = getVisitReference(req)
    const { username } = res.locals.user
    // TODO - not really using full visit details here so could request less information
    const {
      visitHistoryDetails: { visit },
    } = await visitService.getFullVisitDetails({
      reference,
      username,
    })

    if (visit.prisonId !== req.session.selectedEstablishment.prisonId) {
      return res.redirect(`/visit/${visit.reference}`)
    }

    const [prisoner, supportedPrisonIds] = await Promise.all([
      prisonerSearchService.getPrisonerById(visit.prisonerId, username),
      supportedPrisonsService.getSupportedPrisonIds(username),
    ])
    const prisonerLocation = getPrisonerLocation(supportedPrisonIds, prisoner) // TODO does this actually get used?

    const visitorIds = visit.visitors.flatMap(visitor => visitor.nomisPersonId)
    const mainContactVisitor = visit.visitors.find(visitor => visitor.visitContact)
    const mainContactId = mainContactVisitor ? mainContactVisitor.nomisPersonId : null
    const visitorList = await prisonerVisitorsService.getVisitors(visit.prisonerId, username)
    const currentVisitors = visitorList.filter(visitor => visitorIds.includes(visitor.personId))
    const mainContact = currentVisitors.find(visitor => visitor.personId === mainContactId)

    // clean then load session
    clearSession(req)

    const [{ activeAlerts }, restrictions] = await Promise.all([
      prisonerProfileService.getProfile(visit.prisonId, visit.prisonerId, username),
      prisonerProfileService.getRestrictions(visit.prisonerId, username),
    ])

    sortItemsByDateAsc<Alert, 'dateExpires'>(activeAlerts, 'dateExpires')
    sortItemsByDateAsc<OffenderRestriction, 'expiryDate'>(restrictions, 'expiryDate')

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
      allowOverBooking: false,
      prisoner: {
        name: properCaseFullName(`${prisoner.lastName}, ${prisoner.firstName}`),
        offenderNo: prisoner.prisonerNumber,
        location: prisonerLocation,
        activeAlerts,
        restrictions,
      },
      visitSlot,
      originalVisitSlot: visitSlot,
      visitRestriction,
      visitors: currentVisitors,
      visitorSupport: visit.visitorSupport ?? { description: '' },
      mainContact: {
        contact: mainContact,
        phoneNumber: visit.visitContact.telephone,
        email: visit.visitContact.email,
        contactName: visit.visitContact.name,
      },
      visitReference: visit.reference,
    }

    req.session.visitSessionData = Object.assign(req.session.visitSessionData ?? {}, visitSessionData)

    const { policyNoticeDaysMin } = req.session.selectedEstablishment

    const numberOfDays = differenceInCalendarDays(new Date(visit.startTimestamp), new Date())

    if (numberOfDays >= policyNoticeDaysMin) {
      return res.redirect(`/visit/${reference}/update/select-visitors`)
    }
    return res.redirect(`/visit/${reference}/update/confirm-update`)
  })

  const selectVisitors = new SelectVisitors('update', prisonerVisitorsService)
  const visitType = new VisitType('update', auditService)
  const dateAndTime = new DateAndTime('update', visitService, visitSessionsService, auditService)
  const additionalSupport = new AdditionalSupport('update')
  const mainContact = new MainContact('update', visitService)
  const requestMethod = new RequestMethod('update')
  const checkYourBooking = new CheckYourBooking('update', auditService, visitService)
  const overbooking = new Overbooking('update', visitSessionsService)
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
    '/:reference/update/select-date-and-time/overbooking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    (req, res) => overbooking.viewFromSelectDateTime(req, res),
  )

  post(
    '/:reference/update/select-date-and-time/overbooking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    overbooking.validate(),
    (req, res) => dateAndTime.postOverbookings(req, res),
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
    '/:reference/update/check-your-booking/overbooking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 6 }),
    (req, res) => overbooking.viewFromCheckBooking(req, res),
  )

  post(
    '/:reference/update/check-your-booking/overbooking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 6 }),
    overbooking.validate(),
    (req, res) => overbooking.viewFromCheckBooking(req, res),
  )

  get(
    '/:reference/update/confirmation',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 7 }),
    (req, res) => confirmation.get(req, res),
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
  if (prisoner.prisonId === 'OUT') {
    return prisoner.locationDescription
  }
  return supportedPrisonIds.includes(prisoner.prisonId) ? `${prisoner.cellLocation}, ${prisoner.prisonName}` : 'Unknown'
}

const checkVisitReferenceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { reference } = req.params

  if (!isValidVisitReference(reference)) {
    throw new BadRequest()
  }

  next()
}
