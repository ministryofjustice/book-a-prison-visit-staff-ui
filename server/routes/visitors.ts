import type { RequestHandler, Router } from 'express'
import { body, param, validationResult, query } from 'express-validator'
import { VisitorListItem, VisitSessionData, VisitSlot } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import VisitSessionsService from '../services/visitSessionsService'
import isValidPrisonerNumber from './prisonerProfileValidation'
import additionalSupportOptions from '../constants/additionalSupportOptions'
import { checkSession, getSelectedSlot } from './visitorUtils'

export default function routes(
  router: Router,
  prisonerVisitorsService: PrisonerVisitorsService,
  visitSessionsService: VisitSessionsService
): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/select-visitors', async (req, res) => {
    checkSession({
      stage: 1,
      visitData: req.session.visitSessionData,
      res,
    })

    const { offenderNo } = req.session.visitSessionData.prisoner
    const prisonerVisitors = await prisonerVisitorsService.getVisitors(offenderNo, res.locals.user?.username)

    req.session.visitorList = prisonerVisitors.visitorList

    res.render('pages/visitors', { ...prisonerVisitors, offenderNo })
  })

  router.post(
    '/select-visitors',
    body('visitors').custom((value: string, { req }) => {
      const selected = [].concat(value)

      req.session.visitorList = req.session.visitorList.map((visitor: VisitorListItem) => {
        const newVisitor = visitor
        newVisitor.selected = selected.includes(visitor.personId.toString())

        return newVisitor
      })

      if (value === undefined) {
        throw new Error('No visitors selected')
      }

      if (selected.length > 3) {
        throw new Error('Select no more than 3 visitors with a maximum of 2 adults')
      }

      const adults = req.session.visitorList
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
      checkSession({
        stage: 1,
        visitData: req.session.visitSessionData,
        res,
      })

      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res.render('pages/visitors', {
          errors: !errors.isEmpty() ? errors.array() : [],
          prisonerName: req.session.visitSessionData.prisoner.name,
          offenderNo: req.session.visitSessionData.prisoner.offenderNo,
          visitorList: req.session.visitorList,
        })
      }

      const selectedIds = [].concat(req.body.visitors)
      const selectedVisitors = req.session.visitorList.filter((visitor: VisitorListItem) =>
        selectedIds.includes(visitor.personId.toString())
      )

      const adults = selectedVisitors.reduce((adultVisitors: VisitorListItem[], visitor: VisitorListItem) => {
        if (visitor.adult ?? true) {
          adultVisitors.push(visitor)
        }

        return adultVisitors
      }, [])

      req.session.adultVisitors = adults
      req.session.visitSessionData.visitors = selectedVisitors

      return res.redirect('/visit/select-date-and-time')
    }
  )

  router.get(
    '/select-date-and-time',
    query('timeOfDay').customSanitizer((value: string) => (!['morning', 'afternoon'].includes(value) ? '' : value)),
    query('dayOfTheWeek').customSanitizer((value: string) =>
      parseInt(value, 10) >= 0 && parseInt(value, 10) <= 6 ? value : ''
    ),
    async (req, res) => {
      checkSession({
        stage: 2,
        visitData: req.session.visitSessionData,
        res,
      })

      const { timeOfDay, dayOfTheWeek } = req.query
      const slotsList = await visitSessionsService.getVisitSessions({
        username: res.locals.user?.username,
        timeOfDay,
        dayOfTheWeek,
      })

      req.session.slotsList = slotsList
      req.session.timeOfDay = timeOfDay
      req.session.dayOfTheWeek = dayOfTheWeek

      res.render('pages/dateAndTime', {
        prisonerName: req.session.visitSessionData.prisoner.name,
        offenderNo: req.session.visitSessionData.prisoner.offenderNo,
        slotsList,
        timeOfDay,
        dayOfTheWeek,
      })
    }
  )

  router.post(
    '/select-date-and-time',
    body('visit-date-and-time').custom((value: string, { req }) => {
      // check selected slot is in the list that was shown and has available tables
      const selectedSlot: VisitSlot = getSelectedSlot(req.session.slotsList, value)

      if (selectedSlot === undefined || selectedSlot.availableTables === 0) {
        throw new Error('No time slot selected')
      }

      return true
    }),
    async (req, res) => {
      checkSession({
        stage: 2,
        visitData: req.session.visitSessionData,
        res,
      })
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res.render('pages/dateAndTime', {
          errors: !errors.isEmpty() ? errors.array() : [],
          prisonerName: req.session.visitSessionData.prisoner.name,
          offenderNo: req.session.visitSessionData.prisoner.offenderNo,
          slotsList: req.session.slotsList,
          timeOfDay: req.session.timeOfDay,
          dayOfTheWeek: req.session.dayOfTheWeek,
        })
      }

      req.session.visitSessionData.visit = getSelectedSlot(req.session.slotsList, req.body['visit-date-and-time'])

      return res.redirect('/visit/additional-support')
    }
  )

  router.get('/additional-support', async (req, res) => {
    checkSession({
      stage: 3,
      visitData: req.session.visitSessionData,
      res,
    })

    const { offenderNo } = req.session.visitSessionData.prisoner
    const formValues = (req.flash('formValues')?.[0] as unknown as Record<string, string | string[]>) || {}

    if (!Object.keys(formValues).length && req.session.visitSessionData.additionalSupport) {
      formValues.additionalSupportRequired = req.session.visitSessionData.additionalSupport.required ? 'yes' : 'no'
      formValues.additionalSupport = req.session.visitSessionData.additionalSupport.keys
      formValues.otherSupportDetails = req.session.visitSessionData.additionalSupport.other
    }

    res.render('pages/additionalSupport', {
      errors: req.flash('errors'),
      offenderNo,
      additionalSupportOptions: additionalSupportOptions.items,
      formValues,
    })
  })

  router.post(
    '/additional-support',
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
            return valid ? additionalSupportOptions.getKeys().includes(supportReq) : false
          }, true)
          if (!value.length || !validSupportRequest) throw new Error('No request selected')
        }

        return true
      }),
    body('otherSupportDetails')
      .trim()
      .custom((value: string, { req }) => {
        if (<string[]>req.body.additionalSupport.includes('other') && (value ?? '').length === 0) {
          throw new Error('Enter details of the request')
        }

        return true
      }),
    async (req, res) => {
      checkSession({
        stage: 3,
        visitData: req.session.visitSessionData,
        res,
      })

      const { offenderNo } = req.session.visitSessionData.prisoner
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array() as [])
        req.flash('formValues', req.body)
        return res.redirect(req.originalUrl)
      }

      const selectedSupport: VisitSessionData['additionalSupport'] = { required: false }
      if (req.body.additionalSupportRequired === 'yes') {
        selectedSupport.required = true
        selectedSupport.keys = req.body.additionalSupport
        selectedSupport.other = req.body.additionalSupport.includes('other') ? req.body.otherSupportDetails : undefined
      }

      // @TODO conditional will need removing when session validation looked at
      if (req.session.visitSessionData) {
        req.session.visitSessionData.additionalSupport = selectedSupport
      }

      return res.redirect('/visit/select-main-contact')
    }
  )

  router.get('/select-main-contact', async (req, res) => {
    checkSession({
      stage: 4,
      visitData: req.session.visitSessionData,
      res,
    })

    const { offenderNo } = req.session.visitSessionData.prisoner

    res.render('pages/mainContact', {
      offenderNo,
      adultVisitors: req.session.adultVisitors,
    })
  })

  router.post(
    '/select-main-contact',
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
      checkSession({
        stage: 4,
        visitData: req.session.visitSessionData,
        res,
      })

      const { offenderNo } = req.session.visitSessionData.prisoner
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res.render('pages/mainContact', {
          errors: !errors.isEmpty() ? errors.array() : [],
          offenderNo,
          adultVisitors: req.session.adultVisitors,
          phoneNumber: req.body.phoneNumber,
          contact: req.body.contact,
          someoneElseName: req.body.someoneElseName,
        })
      }

      const selectedContact = req.session.visitorList.find(
        (visitor: VisitorListItem) => req.body.contact === visitor.name.replace(' ', '_')
      )

      req.session.visitSessionData.mainContact = {
        contact: selectedContact,
        phoneNumber: req.body.phoneNumber,
        contactName: selectedContact === undefined ? req.body.someoneElseName : undefined,
      }

      return res.redirect(`/visit/check-your-booking/${req.params.offenderNo}`)
    }
  )

  router.get(
    '/check-your-booking/:offenderNo',
    param('offenderNo').custom((value: string) => {
      if (!isValidPrisonerNumber(value)) {
        throw new Error('Invalid prisoner number supplied')
      }

      return true
    }),
    async (req, res) => {
      const { visitSessionData } = req.session
      checkSession({
        stage: 5,
        visitData: visitSessionData,
        res,
      })
      const { offenderNo } = req.session.visitSessionData.prisoner

      const additionalSupport = visitSessionData.additionalSupport?.keys?.map(key => {
        return key === additionalSupportOptions.items.OTHER.key
          ? visitSessionData.additionalSupport.other
          : additionalSupportOptions.getValue(key)
      })

      res.render('pages/checkYourBooking', {
        offenderNo,
        contactDetails: {
          phoneNumber: req.session.visitSessionData.mainContact.phoneNumber,
        },
        mainContact: visitSessionData.mainContact,
        prisoner: visitSessionData.prisoner,
        visit: visitSessionData.visit,
        visitors: visitSessionData.visitors,
        additionalSupport,
      })
    }
  )

  return router
}
