import type { RequestHandler, Router } from 'express'
import { BadRequest } from 'http-errors'
import { body, param, validationResult } from 'express-validator'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import isValidPrisonerNumber from './prisonerProfileValidation'
// @TODO move validation now it's shared?

export default function routes(router: Router, prisonerVisitorsService: PrisonerVisitorsService): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/:offenderNo', async (req, res) => {
    const { offenderNo } = req.params

    if (!isValidPrisonerNumber(offenderNo)) {
      throw new BadRequest()
    }

    const prisonerVisitors = await prisonerVisitorsService.getVisitors(offenderNo, res.locals.user?.username)

    req.session.prisonerName = prisonerVisitors.prisonerName
    req.session.contacts = prisonerVisitors.contacts
    req.session.visitorList = prisonerVisitors.visitorList

    res.render('pages/visitors', { ...prisonerVisitors, formUrl: req.originalUrl })
  })

  router.post(
    '/:offenderNo',
    body('visitors').notEmpty().withMessage('No visitors selected'),
    param('offenderNo').custom((value: string) => {
      if (!isValidPrisonerNumber(value)) {
        throw new Error('Invalid prisoner number supplied')
      }

      return value
    }),
    (req, res) => {
      const errors = validationResult(req)

      res.render('pages/visitors', {
        errors: !errors.isEmpty() ? errors.array() : [],
        prisonerName: req.session.prisonerName,
        contacts: req.session.contacts,
        visitorList: req.session.visitorList,
      })
    }
  )

  return router
}
