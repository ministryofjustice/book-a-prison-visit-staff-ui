import type { RequestHandler, Router } from 'express'
import { BadRequest } from 'http-errors'
import { body, param, validationResult, query } from 'express-validator'
import { VisitorListItem } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import VisitSessionsService from '../services/visitSessionsService'
import isValidPrisonerNumber from './prisonerProfileValidation'
// @TODO move validation now it's shared?

export default function routes(
  router: Router,
  prisonerVisitorsService: PrisonerVisitorsService,
  visitSessionsService: VisitSessionsService
): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/select-visitors/:offenderNo', async (req, res) => {
    const { offenderNo } = req.params

    if (!isValidPrisonerNumber(offenderNo)) {
      throw new BadRequest()
    }

    const prisonerVisitors = await prisonerVisitorsService.getVisitors(offenderNo, res.locals.user?.username)

    req.session.prisonerName = prisonerVisitors.prisonerName
    req.session.offenderNo = offenderNo
    req.session.visitorList = prisonerVisitors.visitorList

    res.render('pages/visitors', { ...prisonerVisitors, offenderNo })
  })

  router.post(
    '/select-visitors/:offenderNo',
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
    param('offenderNo').custom((value: string) => {
      if (!isValidPrisonerNumber(value)) {
        throw new Error('Invalid prisoner number supplied')
      }

      return true
    }),
    (req, res) => {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res.render('pages/visitors', {
          errors: !errors.isEmpty() ? errors.array() : [],
          prisonerName: req.session.prisonerName,
          offenderNo: req.session.offenderNo,
          visitorList: req.session.visitorList,
        })
      }

      const selected = [].concat(req.body.visitors)

      const adults = req.session.visitorList
        .filter((visitor: VisitorListItem) => selected.includes(visitor.personId.toString()))
        .reduce((adultVisitors: VisitorListItem[], visitor: VisitorListItem) => {
          if (visitor.adult ?? true) {
            adultVisitors.push(visitor)
          }

          return adultVisitors
        }, [])

      req.session.adultVisitors = adults

      return res.redirect(`/visit/select-date-and-time/${req.params.offenderNo}`)
    }
  )

  router.get(
    '/select-date-and-time/:offenderNo',
    param('offenderNo').custom((value: string) => {
      if (!isValidPrisonerNumber(value)) {
        throw new Error('Invalid prisoner number supplied')
      }

      return true
    }),
    query('timeOfDay').custom((value: string) => (!['morning', 'afternoon'].includes(value) ? '' : value)),
    query('dayOfTheWeek').custom((value: string) =>
      parseInt(value, 10) >= 0 && parseInt(value, 10) <= 6 ? value : ''
    ),
    async (req, res) => {
      const { offenderNo } = req.params
      const { timeOfDay, dayOfTheWeek } = req.query

      const slotsList = await visitSessionsService.getVisitSessions({
        username: res.locals.user?.username,
        timeOfDay,
        dayOfTheWeek,
      })

      res.render('pages/dateAndTime', {
        offenderNo,
        prisonerName: req.session.prisonerName,
        slotsList,
        timeOfDay,
        dayOfTheWeek,
      })
    }
  )

  router.get(
    '/select-main-contact/:offenderNo',
    param('offenderNo').custom((value: string) => {
      if (!isValidPrisonerNumber(value)) {
        throw new Error('Invalid prisoner number supplied')
      }

      return true
    }),
    async (req, res) => {
      const { offenderNo } = req.params
      const errors = validationResult(req)

      res.render('pages/mainContact', {
        errors: !errors.isEmpty() ? errors.array() : [],
        offenderNo,
        adultVisitors: req.session.adultVisitors,
      })
    }
  )

  router.post(
    '/select-main-contact/:offenderNo',
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
    param('offenderNo').custom((value: string) => {
      if (!isValidPrisonerNumber(value)) {
        throw new Error('Invalid prisoner number supplied')
      }

      return true
    }),
    async (req, res) => {
      const { offenderNo } = req.params
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

      req.session.phoneNumber = req.body.phoneNumber
      req.session.contact = req.body.contact
      req.session.someoneElseName = req.body.someoneElseName

      return res.redirect(`/visit/confirmation/${req.params.offenderNo}`)
    }
  )

  return router
}
