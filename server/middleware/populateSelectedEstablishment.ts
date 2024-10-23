import type { RequestHandler } from 'express'
import asyncMiddleware from './asyncMiddleware'
import { Services } from '../services'
import logger from '../../logger'

export default function populateSelectedEstablishment({ supportedPrisonsService }: Services): RequestHandler {
  return asyncMiddleware(async (req, res, next) => {
    if (req.path === '/change-establishment') {
      res.locals.selectedEstablishment = req.session.selectedEstablishment
      return next()
    }

    const { selectedEstablishment } = req.session
    const { activeCaseLoadId } = res.locals.user

    if (selectedEstablishment && activeCaseLoadId && selectedEstablishment.prisonId !== activeCaseLoadId) {
      logger.info(
        `Redirecting to start: active case load (${activeCaseLoadId}) does not match selected establishment (${selectedEstablishment.prisonId}) for user (${res.locals.user.username})`,
      )
      delete req.session.selectedEstablishment
      return res.redirect('/back-to-start')
    }

    if (selectedEstablishment === undefined) {
      const supportedPrisons = await supportedPrisonsService.getSupportedPrisons(res.locals.user.username)

      if (!supportedPrisons[activeCaseLoadId]) {
        return res.redirect('/change-establishment')
      }

      const prison = await supportedPrisonsService.getPrison(res.locals.user.username, activeCaseLoadId)

      req.session.selectedEstablishment = prison
    }

    res.locals.selectedEstablishment = req.session.selectedEstablishment

    return next()
  })
}
