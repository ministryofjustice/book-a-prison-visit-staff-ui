import type { RequestHandler } from 'express'
import SupportedPrisonsService from '../services/supportedPrisonsService'
import asyncMiddleware from './asyncMiddleware'

export default function populateSelectedEstablishment(
  supportedPrisonsService: SupportedPrisonsService,
): RequestHandler {
  return asyncMiddleware(async (req, res, next) => {
    if (req.session.selectedEstablishment === undefined && req.path !== '/change-establishment') {
      const supportedPrisons = await supportedPrisonsService.getSupportedPrisons(res.locals.user.username)

      const { activeCaseLoadId } = res.locals.user

      if (!supportedPrisons[activeCaseLoadId]) {
        return res.redirect('/change-establishment')
      }

      req.session.selectedEstablishment = {
        prisonId: activeCaseLoadId,
        prisonName: supportedPrisons[activeCaseLoadId],
      }
    }
    res.locals.selectedEstablishment = req.session.selectedEstablishment
    return next()
  })
}
