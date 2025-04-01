import type { NextFunction, RequestHandler, Request, Response } from 'express'
import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { differenceInCalendarDays } from 'date-fns'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { isValidVisitReference } from './validationChecks'
import { clearSession } from './visitorUtils'
import { VisitSessionData, VisitSlot } from '../@types/bapv'
import SelectVisitors from './visitJourney/selectVisitors'
import VisitType from './visitJourney/visitType'
import DateAndTime from './visitJourney/dateAndTime'
import AdditionalSupport from './visitJourney/additionalSupport'
import CheckYourBooking from './visitJourney/checkYourBooking'
import Confirmation from './visitJourney/confirmation'
import MainContact from './visitJourney/mainContact'
import RequestMethod from './visitJourney/requestMethod'
import sessionCheckMiddleware from '../middleware/sessionCheckMiddleware'
import { type Services } from '../services'
import Overbooking from './visitJourney/overbooking'
import { getPrisonerLocation } from './visit/visitUtils'
import { convertToTitleCase } from '../utils/utils'

export default function routes({
  auditService,
  prisonerVisitorsService,
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

    const visitDetails = await visitService.getVisitDetailed({ username, reference })
    const { prison, prisoner } = visitDetails

    const prisonerInVisitPrison = prison.prisonId === prisoner.prisonId
    const visitInSelectedEstablishment = prison.prisonId === req.session.selectedEstablishment.prisonId
    if (!prisonerInVisitPrison || !visitInSelectedEstablishment) {
      return res.redirect(`/visit/${visitDetails.reference}`)
    }

    // clean session then pre-populate with visit to update
    clearSession(req)

    const visitRestriction = visitDetails.visitRestriction === 'UNKNOWN' ? undefined : visitDetails.visitRestriction

    const visitSlot: VisitSlot = {
      id: '',
      sessionTemplateReference: visitDetails.sessionTemplateReference,
      prisonId: prison.prisonId,
      startTimestamp: visitDetails.startTimestamp,
      endTimestamp: visitDetails.endTimestamp,
      availableTables: 0,
      capacity: undefined,
      visitRoom: visitDetails.visitRoom,
      visitRestriction,
    }

    const relationshipDescription = visitDetails.visitors.find(
      visitor => visitor.personId === visitDetails.visitContact.visitContactId,
    )?.relationshipDescription

    const mainContact = {
      contactId: visitDetails.visitContact.visitContactId,
      relationshipDescription,
      phoneNumber: visitDetails.visitContact.telephone,
      email: visitDetails.visitContact.email,
      contactName: visitDetails.visitContact.name,
    }

    const visitSessionData: VisitSessionData = {
      allowOverBooking: false,
      prisoner: {
        firstName: convertToTitleCase(prisoner.firstName),
        lastName: convertToTitleCase(prisoner.lastName),
        offenderNo: prisoner.prisonerNumber,
        location: getPrisonerLocation(prisoner),
        alerts: prisoner.prisonerAlerts,
        restrictions: prisoner.prisonerRestrictions,
      },
      visitSlot,
      originalVisitSlot: visitSlot,
      visitRestriction,
      visitorIds: visitDetails.visitors.map(visitor => visitor.personId),
      visitorSupport: visitDetails.visitorSupport ?? { description: '' },
      mainContact,
      visitReference: visitDetails.reference,
    }

    req.session.visitSessionData = Object.assign(req.session.visitSessionData ?? {}, visitSessionData)

    const { policyNoticeDaysMin } = req.session.selectedEstablishment

    const numberOfDays = differenceInCalendarDays(new Date(visitDetails.startTimestamp), new Date())

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

const checkVisitReferenceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { reference } = req.params

  if (!isValidVisitReference(reference)) {
    throw new BadRequest()
  }

  next()
}
