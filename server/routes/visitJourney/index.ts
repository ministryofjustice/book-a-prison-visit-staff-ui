import { Router } from 'express'
import sessionCheckMiddleware from '../../middleware/sessionCheckMiddleware'
import SelectVisitors from './selectVisitors'
import VisitType from './visitType'
import DateAndTime from './dateAndTime'
import CheckYourBooking from './checkYourBooking'
import Overbooking from './overbooking'
import Confirmation from './confirmation'
import AdditionalSupport from './additionalSupport'
import MainContact from './mainContact'
import RequestMethod from './requestMethod'
import type { Services } from '../../services'
import { BookOrUpdate } from '../../@types/bapv'

export default function routes(
  { auditService, prisonerVisitorsService, visitService, visitSessionsService }: Services,
  bookOrUpdate: BookOrUpdate,
): Router {
  const router = Router()

  const selectVisitors = new SelectVisitors(bookOrUpdate, prisonerVisitorsService)
  const visitType = new VisitType(bookOrUpdate, auditService)
  const additionalSupport = new AdditionalSupport(bookOrUpdate)
  const dateAndTime = new DateAndTime(bookOrUpdate, visitService, visitSessionsService, auditService)
  const mainContact = new MainContact(bookOrUpdate, visitService)
  const requestMethod = new RequestMethod(bookOrUpdate)
  const checkYourBooking = new CheckYourBooking(bookOrUpdate, auditService, visitService)
  const overbooking = new Overbooking(bookOrUpdate, visitSessionsService)
  const confirmation = new Confirmation(bookOrUpdate)

  router.get('/select-visitors', sessionCheckMiddleware({ stage: 1 }), (req, res) => selectVisitors.get(req, res))
  router.post('/select-visitors', sessionCheckMiddleware({ stage: 1 }), selectVisitors.validate(), (req, res) =>
    selectVisitors.post(req, res),
  )

  router.get('/visit-type', sessionCheckMiddleware({ stage: 2 }), (req, res) => visitType.get(req, res))
  router.post('/visit-type', sessionCheckMiddleware({ stage: 2 }), visitType.validate(), (req, res) =>
    visitType.post(req, res),
  )

  router.get('/select-date-and-time', sessionCheckMiddleware({ stage: 2 }), (req, res) => dateAndTime.get(req, res))
  router.post('/select-date-and-time', sessionCheckMiddleware({ stage: 2 }), dateAndTime.validate(), (req, res) =>
    dateAndTime.post(req, res),
  )

  router.get('/select-date-and-time/overbooking', sessionCheckMiddleware({ stage: 2 }), (req, res) =>
    overbooking.viewFromSelectDateTime(req, res),
  )
  router.post(
    '/select-date-and-time/overbooking',
    sessionCheckMiddleware({ stage: 2 }),
    overbooking.validate(),
    (req, res) => dateAndTime.postOverbookings(req, res),
  )

  router.get('/additional-support', sessionCheckMiddleware({ stage: 3 }), (req, res) => additionalSupport.get(req, res))
  router.post(
    '/additional-support',
    sessionCheckMiddleware({ stage: 3 }),
    ...additionalSupport.validate(),
    (req, res) => additionalSupport.post(req, res),
  )

  router.get('/select-main-contact', sessionCheckMiddleware({ stage: 4 }), (req, res) => mainContact.get(req, res))
  router.post('/select-main-contact', sessionCheckMiddleware({ stage: 4 }), ...mainContact.validate(), (req, res) =>
    mainContact.post(req, res),
  )

  router.get('/request-method', sessionCheckMiddleware({ stage: 5 }), (req, res) => requestMethod.get(req, res))
  router.post('/request-method', sessionCheckMiddleware({ stage: 5 }), ...requestMethod.validate(), (req, res) =>
    requestMethod.post(req, res),
  )

  router.get('/check-your-booking', sessionCheckMiddleware({ stage: 6 }), (req, res) => checkYourBooking.get(req, res))
  router.post('/check-your-booking', sessionCheckMiddleware({ stage: 6 }), (req, res) =>
    checkYourBooking.post(req, res),
  )

  router.get('/check-your-booking/overbooking', sessionCheckMiddleware({ stage: 6 }), (req, res) =>
    overbooking.viewFromCheckBooking(req, res),
  )
  router.post(
    '/check-your-booking/overbooking',
    sessionCheckMiddleware({ stage: 6 }),
    overbooking.validate(),
    (req, res) => checkYourBooking.post(req, res),
  )

  router.get('/confirmation', sessionCheckMiddleware({ stage: 7 }), (req, res) => confirmation.get(req, res))

  return router
}
