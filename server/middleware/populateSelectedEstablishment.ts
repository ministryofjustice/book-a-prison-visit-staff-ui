import type { RequestHandler } from 'express'
import config from '../config'
import SupportedPrisonsService from '../services/supportedPrisonsService'

export default function populateSelectedEstablishment(
  supportedPrisonsService: SupportedPrisonsService,
): RequestHandler {
  return async (req, res, next) => {
    // using req.originalUrl rather than ideally req.path as this was causing problems
    // because of middleware sometimes being called twice (expected to be resolved in VB-1430)
    if (req.session.selectedEstablishment === undefined && !req.originalUrl.startsWith('/change-establishment')) {
      const supportedPrisons = await supportedPrisonsService.getSupportedPrisons(res.locals.user?.username)

      // Override active caseload with Hewell if establishment switcher feature not enabled
      const activeCaseLoadId = config.features.establishmentSwitcherEnabled ? res.locals.user.activeCaseLoadId : 'HEI'

      if (supportedPrisons[activeCaseLoadId]) {
        req.session.selectedEstablishment = {
          prisonId: activeCaseLoadId,
          prisonName: supportedPrisons[activeCaseLoadId],
        }
      } else {
        return res.redirect('/change-establishment')
      }
    }
    res.locals.selectedEstablishment = req.session.selectedEstablishment

    return next()
  }
}
