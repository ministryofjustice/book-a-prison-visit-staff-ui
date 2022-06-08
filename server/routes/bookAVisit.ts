import type { RequestHandler, Router } from 'express'
import { body, validationResult, query } from 'express-validator'
import { VisitorListItem, VisitSlot } from '../@types/bapv'
import sessionCheckMiddleware from '../middleware/sessionCheckMiddleware'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import PrisonerProfileService from '../services/prisonerProfileService'
import VisitSessionsService from '../services/visitSessionsService'
import { clearSession, getFlashFormValues, getSelectedSlot, getSupportTypeDescriptions } from './visitorUtils'
import { SupportType, VisitorSupport } from '../data/visitSchedulerApiTypes'
import asyncMiddleware from '../middleware/asyncMiddleware'

export default function routes(
  router: Router,
  prisonerVisitorsService: PrisonerVisitorsService,
  visitSessionsService: VisitSessionsService,
  prisonerProfileService: PrisonerProfileService
): Router {
  const get = (path: string, ...handlers: RequestHandler[]) =>
    router.get(
      path,
      handlers.map(handler => asyncMiddleware(handler))
    )

  const post = (path: string, ...handlers: RequestHandler[]) =>
    router.post(
      path,
      handlers.map(handler => asyncMiddleware(handler))
    )

  get('/select-visitors', sessionCheckMiddleware({ stage: 1 }), async (req, res) => {
    const { visitSessionData } = req.session
    const { offenderNo } = visitSessionData.prisoner

    const visitorList = await prisonerVisitorsService.getVisitors(offenderNo, res.locals.user?.username)
    if (!req.session.visitorList) {
      req.session.visitorList = { visitors: [] }
    }
    req.session.visitorList.visitors = visitorList

    const restrictions = await prisonerProfileService.getRestrictions(offenderNo, res.locals.user?.username)
    req.session.visitSessionData.prisoner.restrictions = restrictions

    const formValues = getFlashFormValues(req)
    if (!Object.keys(formValues).length && visitSessionData.visitors) {
      formValues.visitors = visitSessionData.visitors.map(visitor => visitor.personId.toString())
    }

    res.render('pages/visitors', {
      errors: req.flash('errors'),
      offenderNo: visitSessionData.prisoner.offenderNo,
      prisonerName: visitSessionData.prisoner.name,
      visitorList,
      restrictions,
      formValues,
    })
  })

  post(
    '/select-visitors',
    sessionCheckMiddleware({ stage: 1 }),
    body('visitors').custom((value: string, { req }) => {
      const selected = [].concat(value)

      if (value === undefined) {
        throw new Error('No visitors selected')
      }

      const selectedAndBanned = req.session.visitorList.visitors.filter((visitor: VisitorListItem) => {
        return selected.includes(visitor.personId.toString()) && visitor.banned
      })
      if (selectedAndBanned.length) {
        throw new Error('Invalid selection')
      }

      if (selected.length > 3) {
        throw new Error('Select no more than 3 visitors with a maximum of 2 adults')
      }

      const adults = req.session.visitorList.visitors
        .filter((visitor: VisitorListItem) => selected.includes(visitor.personId.toString()))
        .reduce((count: number, visitor: VisitorListItem) => {
          return visitor.adult ?? true ? count + 1 : count
        }, 0)

      if (adults === 0) {
        throw new Error('Add an adult to the visit')
      }

      if (adults > 2) {
        throw new Error('Select no more than 2 adults')
      }

      return true
    }),
    (req, res) => {
      const { visitSessionData } = req.session
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array() as [])
        req.flash('formValues', req.body)
        return res.redirect(req.originalUrl)
      }

      const selectedIds = [].concat(req.body.visitors)
      const selectedVisitors = req.session.visitorList.visitors.filter((visitor: VisitorListItem) =>
        selectedIds.includes(visitor.personId.toString())
      )

      const adults = selectedVisitors.reduce((adultVisitors: VisitorListItem[], visitor: VisitorListItem) => {
        if (visitor.adult ?? true) {
          adultVisitors.push(visitor)
        }

        return adultVisitors
      }, [])
      visitSessionData.visitors = selectedVisitors

      if (!req.session.adultVisitors) {
        req.session.adultVisitors = { adults: [] }
      }
      req.session.adultVisitors.adults = adults

      const closedVisitVisitors = selectedVisitors.reduce((closedVisit, visitor) => {
        return closedVisit || visitor.restrictions.some(restriction => restriction.restrictionType === 'CLOSED')
      }, false)
      visitSessionData.visitRestriction = closedVisitVisitors ? 'CLOSED' : 'OPEN'
      visitSessionData.closedVisitReason = closedVisitVisitors ? 'visitor' : undefined

      const closedVisitPrisoner = visitSessionData.prisoner.restrictions.some(restriction => {
        return restriction.restrictionType === 'CLOSED'
      })

      return !closedVisitVisitors && closedVisitPrisoner
        ? res.redirect('/book-a-visit/visit-type')
        : res.redirect('/book-a-visit/select-date-and-time')
    }
  )

  get('/visit-type', sessionCheckMiddleware({ stage: 2 }), async (req, res) => {
    const { visitSessionData } = req.session

    const closedRestrictions = visitSessionData.prisoner.restrictions.filter(
      restriction => restriction.restrictionType === 'CLOSED'
    )

    res.render('pages/visitType', {
      errors: req.flash('errors'),
      restrictions: closedRestrictions,
      visitors: visitSessionData.visitors,
    })
  })

  post(
    '/visit-type',
    sessionCheckMiddleware({ stage: 2 }),
    body('visitType').isIn(['OPEN', 'CLOSED']).withMessage('No visit type selected'),
    async (req, res) => {
      const { visitSessionData } = req.session
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array() as [])
        return res.redirect(req.originalUrl)
      }

      visitSessionData.visitRestriction = req.body.visitType
      visitSessionData.closedVisitReason = req.body.visitType === 'CLOSED' ? 'prisoner' : undefined

      return res.redirect('/book-a-visit/select-date-and-time')
    }
  )

  get(
    '/select-date-and-time',
    sessionCheckMiddleware({ stage: 2 }),
    query('timeOfDay').customSanitizer((value: string) => (!['morning', 'afternoon'].includes(value) ? '' : value)),
    query('dayOfTheWeek').customSanitizer((value: string) =>
      parseInt(value, 10) >= 0 && parseInt(value, 10) <= 6 ? value : ''
    ),
    async (req, res) => {
      const { visitSessionData } = req.session
      const { timeOfDay, dayOfTheWeek } = req.query as Record<string, string>
      const slotsList = await visitSessionsService.getVisitSessions({
        username: res.locals.user?.username,
        offenderNo: visitSessionData.prisoner.offenderNo,
        visitRestriction: visitSessionData.visitRestriction,
        timeOfDay,
        dayOfTheWeek,
      })

      const formValues = getFlashFormValues(req)
      if (!Object.keys(formValues).length && visitSessionData.visit?.id) {
        formValues['visit-date-and-time'] = visitSessionData.visit?.id
      }

      req.session.slotsList = slotsList
      req.session.timeOfDay = timeOfDay
      req.session.dayOfTheWeek = dayOfTheWeek

      res.render('pages/dateAndTime', {
        errors: req.flash('errors'),
        visitRestriction: visitSessionData.visitRestriction,
        prisonerName: visitSessionData.prisoner.name,
        closedVisitReason: visitSessionData.closedVisitReason,
        slotsList,
        timeOfDay,
        dayOfTheWeek,
        formValues,
      })
    }
  )

  post(
    '/select-date-and-time',
    sessionCheckMiddleware({ stage: 2 }),
    body('visit-date-and-time').custom((value: string, { req }) => {
      // check selected slot is in the list that was shown and has available tables
      const selectedSlot: VisitSlot = getSelectedSlot(req.session.slotsList, value)

      if (selectedSlot === undefined || selectedSlot.availableTables === 0) {
        throw new Error('No time slot selected')
      }

      return true
    }),
    async (req, res) => {
      const { visitSessionData } = req.session
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array() as [])
        req.flash('formValues', req.body)
        if (req.session.timeOfDay || req.session.dayOfTheWeek) {
          return res.redirect(
            `${req.originalUrl}?timeOfDay=${req.session.timeOfDay}&dayOfTheWeek=${req.session.dayOfTheWeek}`
          )
        }
        return res.redirect(req.originalUrl)
      }

      visitSessionData.visit = getSelectedSlot(req.session.slotsList, req.body['visit-date-and-time'])

      if (req.session.visitSessionData.visitReference) {
        await visitSessionsService.updateVisit({
          username: res.locals.user?.username,
          visitData: visitSessionData,
        })
      } else {
        const { reference, visitStatus } = await visitSessionsService.createVisit({
          username: res.locals.user?.username,
          visitData: visitSessionData,
        })

        req.session.visitSessionData.visitReference = reference
        req.session.visitSessionData.visitStatus = visitStatus
      }

      return res.redirect('/book-a-visit/additional-support')
    }
  )

  get('/additional-support', sessionCheckMiddleware({ stage: 3 }), async (req, res) => {
    const { visitSessionData } = req.session
    const formValues = getFlashFormValues(req)

    if (!req.session.availableSupportTypes) {
      req.session.availableSupportTypes = await visitSessionsService.getAvailableSupportOptions(
        res.locals.user?.username
      )
    }
    const { availableSupportTypes } = req.session

    if (!Object.keys(formValues).length && visitSessionData.visitorSupport) {
      formValues.additionalSupportRequired = visitSessionData.visitorSupport.length ? 'yes' : 'no'
      formValues.additionalSupport = visitSessionData.visitorSupport.map(support => support.type)
      formValues.otherSupportDetails = visitSessionData.visitorSupport.find(support => support.type === 'OTHER')?.text
    }

    res.render('pages/additionalSupport', {
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
    }
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

    res.render('pages/mainContact', {
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
        (visitor: VisitorListItem) => req.body.contact === visitor.personId.toString()
      )

      visitSessionData.mainContact = {
        contact: selectedContact,
        phoneNumber: req.body.phoneNumber,
        contactName: selectedContact === undefined ? req.body.someoneElseName : undefined,
      }

      return res.redirect('/book-a-visit/check-your-booking')
    }
  )

  get('/check-your-booking', sessionCheckMiddleware({ stage: 5 }), async (req, res) => {
    const { visitSessionData } = req.session
    const { offenderNo } = visitSessionData.prisoner

    const additionalSupport = getSupportTypeDescriptions(
      req.session.availableSupportTypes,
      visitSessionData.visitorSupport
    )

    res.render('pages/checkYourBooking', {
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
      visitSessionData.visitorSupport
    )

    try {
      const bookedVisit = await visitSessionsService.updateVisit({
        username: res.locals.user?.username,
        visitData: req.session.visitSessionData,
        visitStatus: 'BOOKED',
      })

      req.session.visitSessionData.visitStatus = bookedVisit.visitStatus
    } catch (error) {
      return res.render('pages/checkYourBooking', {
        errors: [
          {
            msg: 'Failed to make complete the reservation',
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
      visitSessionData.visitorSupport
    )

    clearSession(req)

    res.render('pages/confirmation')
  })

  return router
}
