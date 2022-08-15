import type { RequestHandler, Router } from 'express'
import { body, validationResult } from 'express-validator'
import { VisitorListItem } from '../@types/bapv'
import sessionCheckMiddleware from '../middleware/sessionCheckMiddleware'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import PrisonerProfileService from '../services/prisonerProfileService'
import VisitSessionsService from '../services/visitSessionsService'
import { clearSession, getFlashFormValues, getSupportTypeDescriptions } from './visitorUtils'
import { SupportType, VisitorSupport } from '../data/visitSchedulerApiTypes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import NotificationsService from '../services/notificationsService'
import AuditService from '../services/auditService'
import config from '../config'
import logger from '../../logger'
import SelectVisitors from './visitJourney/selectVisitors'
import VisitType from './visitJourney/visitType'
import DateAndTime from './visitJourney/dateAndTime'

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
  const dateAndTime = new DateAndTime('book', visitSessionsService, auditService)

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

  get('/additional-support', sessionCheckMiddleware({ stage: 3 }), async (req, res) => {
    const { visitSessionData } = req.session
    const formValues = getFlashFormValues(req)

    if (!req.session.availableSupportTypes) {
      req.session.availableSupportTypes = await visitSessionsService.getAvailableSupportOptions(
        res.locals.user?.username,
      )
    }
    const { availableSupportTypes } = req.session

    if (!Object.keys(formValues).length && visitSessionData.visitorSupport) {
      formValues.additionalSupportRequired = visitSessionData.visitorSupport.length ? 'yes' : 'no'
      formValues.additionalSupport = visitSessionData.visitorSupport.map(support => support.type)
      formValues.otherSupportDetails = visitSessionData.visitorSupport.find(support => support.type === 'OTHER')?.text
    }

    res.render('pages/bookAVisit/additionalSupport', {
      errors: req.flash('errors'),
      availableSupportTypes,
      formValues,
    })
  })

  post(
    '/additional-support',
    sessionCheckMiddleware({ stage: 3 }),
    body('additionalSupportRequired').custom((value: string) => {
      if (!/^yes|no$/.test(value)) {
        throw new Error('No answer selected')
      }

      return true
    }),
    body('additionalSupport')
      .toArray()
      .custom((value: string[], { req }) => {
        if (req.body.additionalSupportRequired === 'yes') {
          const validSupportRequest = value.reduce((valid, supportReq) => {
            return valid
              ? req.session.availableSupportTypes.find((option: SupportType) => option.type === supportReq)
              : false
          }, true)
          if (!value.length || !validSupportRequest) throw new Error('No request selected')
        }

        return true
      }),
    body('otherSupportDetails')
      .trim()
      .custom((value: string, { req }) => {
        if (<string[]>req.body.additionalSupport.includes('OTHER') && (value ?? '').length === 0) {
          throw new Error('Enter details of the request')
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

      visitSessionData.visitorSupport = req.body.additionalSupport.map((support: string): VisitorSupport => {
        const supportItem: VisitorSupport = { type: support }
        if (support === 'OTHER') {
          supportItem.text = req.body.otherSupportDetails
        }
        return supportItem
      })

      return res.redirect('/book-a-visit/select-main-contact')
    },
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

  get('/check-your-booking', sessionCheckMiddleware({ stage: 5 }), async (req, res) => {
    const { visitSessionData } = req.session
    const { offenderNo } = visitSessionData.prisoner

    const additionalSupport = getSupportTypeDescriptions(
      req.session.availableSupportTypes,
      visitSessionData.visitorSupport,
    )

    res.render('pages/bookAVisit/checkYourBooking', {
      offenderNo,
      mainContact: visitSessionData.mainContact,
      prisoner: visitSessionData.prisoner,
      visit: visitSessionData.visit,
      visitRestriction: visitSessionData.visitRestriction,
      visitors: visitSessionData.visitors,
      additionalSupport,
    })
  })

  post('/check-your-booking', sessionCheckMiddleware({ stage: 5 }), async (req, res) => {
    const { visitSessionData } = req.session
    const { offenderNo } = req.session.visitSessionData.prisoner

    const additionalSupport = getSupportTypeDescriptions(
      req.session.availableSupportTypes,
      visitSessionData.visitorSupport,
    )

    try {
      const bookedVisit = await visitSessionsService.updateVisit({
        username: res.locals.user?.username,
        visitData: req.session.visitSessionData,
        visitStatus: 'BOOKED',
      })

      req.session.visitSessionData.visitStatus = bookedVisit.visitStatus

      await auditService.bookedVisit(
        req.session.visitSessionData.visitReference,
        visitSessionData.prisoner.offenderNo,
        'HEI',
        visitSessionData.visitors.map(visitor => visitor.personId.toString()),
        res.locals.user?.username,
        res.locals.appInsightsOperationId,
      )

      if (config.apis.notifications.enabled) {
        try {
          const phoneNumber = visitSessionData.mainContact.phoneNumber.replace(/\s/g, '')

          await notificationsService.sendBookingSms({
            phoneNumber,
            visit: visitSessionData.visit,
            prisonName: 'Hewell (HMP)',
            reference: visitSessionData.visitReference,
          })
          logger.info(`Booking SMS sent for ${visitSessionData.visitReference}`)
        } catch (error) {
          logger.error(`Failed to send SMS for booking ${visitSessionData.visitReference}`)
        }
      }
    } catch (error) {
      return res.render('pages/bookAVisit/checkYourBooking', {
        errors: [
          {
            msg: 'Failed to make this reservation. You can try to submit again.',
            param: 'id',
          },
        ],
        offenderNo,
        mainContact: visitSessionData.mainContact,
        prisoner: visitSessionData.prisoner,
        visit: visitSessionData.visit,
        visitRestriction: visitSessionData.visitRestriction,
        visitors: visitSessionData.visitors,
        additionalSupport,
      })
    }

    return res.redirect('/book-a-visit/confirmation')
  })

  get('/confirmation', sessionCheckMiddleware({ stage: 6 }), async (req, res) => {
    const { visitSessionData } = req.session

    res.locals.prisoner = visitSessionData.prisoner
    res.locals.visit = visitSessionData.visit
    res.locals.visitRestriction = visitSessionData.visitRestriction
    res.locals.visitors = visitSessionData.visitors
    res.locals.mainContact = visitSessionData.mainContact
    res.locals.visitReference = visitSessionData.visitReference
    res.locals.additionalSupport = getSupportTypeDescriptions(
      req.session.availableSupportTypes,
      visitSessionData.visitorSupport,
    )

    clearSession(req)

    res.render('pages/bookAVisit/confirmation')
  })

  return router
}
