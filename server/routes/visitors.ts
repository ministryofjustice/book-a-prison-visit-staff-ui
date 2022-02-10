import type { RequestHandler, Router } from 'express'
import { BadRequest } from 'http-errors'
import { body, param, validationResult } from 'express-validator'
import { VisitorListItem } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import isValidPrisonerNumber from './prisonerProfileValidation'
// @TODO move validation now it's shared?

export default function routes(router: Router, prisonerVisitorsService: PrisonerVisitorsService): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/select-visitors/:offenderNo', async (req, res) => {
    const { offenderNo } = req.params

    if (!isValidPrisonerNumber(offenderNo)) {
      throw new BadRequest()
    }

    const prisonerVisitors = await prisonerVisitorsService.getVisitors(offenderNo, res.locals.user?.username)

    req.session.prisonerName = prisonerVisitors.prisonerName
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

      return selected
    }),
    param('offenderNo').custom((value: string) => {
      if (!isValidPrisonerNumber(value)) {
        throw new Error('Invalid prisoner number supplied')
      }

      return value
    }),
    (req, res) => {
      const errors = validationResult(req)

      if (errors.isEmpty()) {
        return res.redirect(`/visit/select-date-and-time/${req.params.offenderNo}`)
      }

      return res.render('pages/visitors', {
        errors: !errors.isEmpty() ? errors.array() : [],
        prisonerName: req.session.prisonerName,
        contacts: req.session.contacts,
        visitorList: req.session.visitorList,
      })
    }
  )

  get('/select-date-and-time/:offenderNo', async (req, res) => {
    const { offenderNo } = req.params

    if (!isValidPrisonerNumber(offenderNo)) {
      throw new BadRequest()
    }

    // const prisonerVisitors = await prisonerVisitorsService.getVisitors(offenderNo, res.locals.user?.username)
    const slotsList = {
      'February 2022': [
        {
          date: 'Monday 7 February',
          slots: {
            morning: [
              {
                id: 'a',
                startTime: 'a',
                endTime: 'b',
                availableTables: 1,
              },
            ],
            afternoon: [
              {
                id: 'b',
                startTime: 'a',
                endTime: 'b',
                availableTables: 3,
              },
            ],
          },
        },
        {
          date: 'Tuesday 8 February',
          slots: {
            morning: [
              {
                id: 'c',
                startTime: 'a',
                endTime: 'b',
                availableTables: 3,
              },
            ],
            afternoon: [
              {
                id: 'd',
                startTime: 'a',
                endTime: 'b',
                availableTables: 3,
              },
              {
                id: 'd1',
                startTime: 'a',
                endTime: 'b',
                availableTables: 0,
              },
            ],
          },
        },
      ],
      'March 2022': [
        {
          date: 'Monday 7 March',
          slots: {
            morning: [
              {
                id: 'e',
                startTime: 'a',
                endTime: 'b',
                availableTables: 3,
              },
            ],
            afternoon: [
              {
                id: 'f',
                startTime: 'a',
                endTime: 'b',
                availableTables: 3,
              },
            ],
          },
        },
        {
          date: 'Tuesday 8 March',
          slots: {
            morning: [
              {
                id: 'g',
                startTime: 'a',
                endTime: 'b',
                availableTables: 3,
              },
            ],
            afternoon: [
              {
                id: 'h',
                startTime: 'a',
                endTime: 'b',
                availableTables: 3,
              },
            ],
          },
        },
      ],
    }

    res.render('pages/dateAndTime', {
      offenderNo,
      prisonerName: req.session.prisonerName,
      slotsList,
    })
  })

  return router
}
