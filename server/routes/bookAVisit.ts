import type { RequestHandler, Router } from 'express'
import { body, validationResult } from 'express-validator'
import { VisitorListItem } from '../@types/bapv'
import sessionCheckMiddleware from '../middleware/sessionCheckMiddleware'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import PrisonerProfileService from '../services/prisonerProfileService'
import VisitSessionsService from '../services/visitSessionsService'
import { getFlashFormValues } from './visitorUtils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import NotificationsService from '../services/notificationsService'
import AuditService from '../services/auditService'
import SelectVisitors from './visitJourney/selectVisitors'
import VisitType from './visitJourney/visitType'
import DateAndTime from './visitJourney/dateAndTime'
import CheckYourBooking from './visitJourney/checkYourBooking'
import Confirmation from './visitJourney/confirmation'
import AdditionalSupport from './visitJourney/additionalSupport'

export default function routes(
  router: Router,
  prisonerVisitorsService: PrisonerVisitorsService,
  visitSessionsService: VisitSessionsService,
  prisonerProfileService: PrisonerProfileService,
  notificationsService: NotificationsService,
  auditService: AuditService,
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

  const selectVisitors = new SelectVisitors('book', prisonerVisitorsService, prisonerProfileService)
  const visitType = new VisitType('book', auditService)
  const additionalSupport = new AdditionalSupport('book', visitSessionsService)
  const dateAndTime = new DateAndTime('book', visitSessionsService, auditService)
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

  get('/select-date-and-time', sessionCheckMiddleware({ stage: 2 }), ...dateAndTime.validateGet(), (req, res) =>
    dateAndTime.get(req, res),
  )
  post('/select-date-and-time', sessionCheckMiddleware({ stage: 2 }), dateAndTime.validate(), (req, res) =>
    dateAndTime.post(req, res),
  )

  get('/additional-support', sessionCheckMiddleware({ stage: 3 }), (req, res) => additionalSupport.get(req, res))
  post('/additional-support', sessionCheckMiddleware({ stage: 3 }), ...additionalSupport.validate(), (req, res) =>
    additionalSupport.post(req, res),
  )

  get('/select-main-contact', sessionCheckMiddleware({ stage: 4 }), async (req, res) => {
    const { visitSessionData } = req.session
    const formValues = getFlashFormValues(req)

    if (!Object.keys(formValues).length && visitSessionData.mainContact) {
      formValues.contact = visitSessionData.mainContact.contact
        ? visitSessionData.mainContact.contact.personId.toString()
        : 'someoneElse'
      formValues.phoneNumber = visitSessionData.mainContact.phoneNumber
      formValues.someoneElseName = visitSessionData.mainContact.contact
        ? undefined
        : visitSessionData.mainContact.contactName
    }

    res.render('pages/bookAVisit/mainContact', {
      errors: req.flash('errors'),
      adultVisitors: req.session.adultVisitors?.adults,
      formValues,
    })
  })

  post(
    '/select-main-contact',
    sessionCheckMiddleware({ stage: 4 }),
    body('contact').custom((value: string) => {
      if (!value) {
        throw new Error('No main contact selected')
      }

      return true
    }),
    body('someoneElseName').custom((value: string, { req }) => {
      if (value === '' && req.body.contact === 'someoneElse') {
        throw new Error('Enter the name of the main contact')
      }

      return true
    }),
    body('phoneNumber').custom((value: string) => {
      if (!value) {
        throw new Error('Enter a phone number')
      }

      if (!/^(?:0|\+?44)(?:\d\s?){9,10}$/.test(value)) {
        throw new Error('Enter a valid UK phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192')
      }

      return true
    }),
    async (req, res) => {
      const { visitSessionData } = req.session
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array() as [])
        req.flash('formValues', req.body)
        return res.redirect(req.originalUrl)
      }

      const selectedContact = req.session.visitorList.visitors.find(
        (visitor: VisitorListItem) => req.body.contact === visitor.personId.toString(),
      )

      visitSessionData.mainContact = {
        contact: selectedContact,
        phoneNumber: req.body.phoneNumber,
        contactName: selectedContact === undefined ? req.body.someoneElseName : undefined,
      }

      return res.redirect('/book-a-visit/check-your-booking')
    },
  )

  get('/check-your-booking', sessionCheckMiddleware({ stage: 5 }), (req, res) => checkYourBooking.get(req, res))

  post('/check-your-booking', sessionCheckMiddleware({ stage: 5 }), (req, res) => checkYourBooking.post(req, res))

  get('/confirmation', sessionCheckMiddleware({ stage: 6 }), (req, res) => confirmation.get(req, res))

  return router
}
