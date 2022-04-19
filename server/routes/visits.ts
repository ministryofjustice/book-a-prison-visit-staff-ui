import type { RequestHandler, Router } from 'express'
import { BadRequest } from 'http-errors'
import { VisitInformation } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import VisitSessionsService from '../services/visitSessionsService'
import { isValidVisitReference } from './validationChecks'

export default function routes(router: Router, visitSessionsService: VisitSessionsService): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/:reference', async (req, res) => {
    const { reference } = req.params

    if (!isValidVisitReference(reference)) {
      throw new BadRequest()
    }

    const visit: VisitInformation = await visitSessionsService.getVisit({
      reference,
      username: res.locals.user?.username,
    })

    return res.render('pages/visit', { visit })
  })

  return router
}
