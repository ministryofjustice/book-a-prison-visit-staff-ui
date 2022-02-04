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
    res.render('pages/visitors', { ...prisonerVisitors, url: req.originalUrl })
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

      // if (!errors.isEmpty()) {
      //   return res.status(422).json({ errors: errors.array() })
      // }

      res.render('pages/visitors', { errors: errors.array() || [], formattedErrors: JSON.stringify(errors) })
    }
  )

  return router
}
