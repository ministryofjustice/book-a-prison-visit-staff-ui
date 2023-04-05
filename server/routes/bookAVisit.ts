import { type RequestHandler, Router } from 'express'
import sessionCheckMiddleware from '../middleware/sessionCheckMiddleware'
import asyncMiddleware from '../middleware/asyncMiddleware'
import SelectVisitors from './visitJourney/selectVisitors'
import VisitType from './visitJourney/visitType'
import DateAndTime from './visitJourney/dateAndTime'
import CheckYourBooking from './visitJourney/checkYourBooking'
import Confirmation from './visitJourney/confirmation'
import AdditionalSupport from './visitJourney/additionalSupport'
import MainContact from './visitJourney/mainContact'
import RequestMethod from './visitJourney/requestMethod'
import type { Services } from '../services'

export default function routes({
  auditService,
  notificationsService,
  prisonerProfileService,
  prisonerVisitorsService,
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

  const selectVisitors = new SelectVisitors('book', prisonerVisitorsService, prisonerProfileService)
  const visitType = new VisitType('book', auditService)
  const additionalSupport = new AdditionalSupport('book', visitSessionsService)
  const dateAndTime = new DateAndTime('book', visitSessionsService, auditService)
  const mainContact = new MainContact('book')
  const requestMethod = new RequestMethod('book')
  const checkYourBooking = new CheckYourBooking('book', visitSessionsService, auditService, notificationsService)
  const confirmation = new Confirmation('book')

  get('/select-visitors', sessionCheckMiddleware({ stage: 1 }), (req, res) => selectVisitors.get(req, res))
  post('/select-visitors', sessionCheckMiddleware({ stage: 1 }), selectVisitors.validate(), (req, res) =>
    selectVisitors.post(req, res),
  )

  get('/visit-type', sessionCheckMiddleware({ stage: 2 }), (req, res) => visitType.get(req, res))
  post('/visit-type', sessionCheckMiddleware({ stage: 2 }), visitType.validate(), (req, res) =>
    visitType.post(req, res),
  )

  get('/select-date-and-time', sessionCheckMiddleware({ stage: 2 }), (req, res) => dateAndTime.get(req, res))
  post('/select-date-and-time', sessionCheckMiddleware({ stage: 2 }), dateAndTime.validate(), (req, res) =>
    dateAndTime.post(req, res),
  )

  get('/additional-support', sessionCheckMiddleware({ stage: 3 }), (req, res) => additionalSupport.get(req, res))
  post('/additional-support', sessionCheckMiddleware({ stage: 3 }), ...additionalSupport.validate(), (req, res) =>
    additionalSupport.post(req, res),
  )

  get('/select-main-contact', sessionCheckMiddleware({ stage: 4 }), (req, res) => mainContact.get(req, res))
  post('/select-main-contact', sessionCheckMiddleware({ stage: 4 }), ...mainContact.validate(), (req, res) =>
    mainContact.post(req, res),
  )

  get('/request-method', sessionCheckMiddleware({ stage: 5 }), (req, res) => requestMethod.get(req, res))
  post('/request-method', sessionCheckMiddleware({ stage: 5 }), ...requestMethod.validate(), (req, res) =>
    requestMethod.post(req, res),
  )

  get('/check-your-booking', sessionCheckMiddleware({ stage: 6 }), (req, res) => checkYourBooking.get(req, res))
  post('/check-your-booking', sessionCheckMiddleware({ stage: 6 }), (req, res) => checkYourBooking.post(req, res))

  get('/confirmation', sessionCheckMiddleware({ stage: 7 }), (req, res) => confirmation.get(req, res))

  return router
}
