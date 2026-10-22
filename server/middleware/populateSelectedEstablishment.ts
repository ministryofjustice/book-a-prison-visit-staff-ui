import type { RequestHandler } from 'express'
import { Services } from '../services'
import logger from '../../logger'

export default function populateSelectedEstablishment({ supportedPrisonsService }: Services): RequestHandler {
  return async (req, res, next) => {
    if (req.path === '/establishment-not-supported') {
      return next()
    }

    // TODO TODO this is to handle old sessions during deployment; can be removed in a subsequent deployment
    req.session.selectedEstablishmentId ??= req.session.selectedEstablishment?.prisonId
    delete req.session.selectedEstablishment

    const { selectedEstablishmentId } = req.session
    const { activeCaseLoadId } = res.locals.user
    const establishmentAndCaseLoadMatch = activeCaseLoadId !== undefined && selectedEstablishmentId === activeCaseLoadId

    req.context = req.context || {}

    if (establishmentAndCaseLoadMatch || (selectedEstablishmentId && !activeCaseLoadId)) {
      res.locals.selectedEstablishment = await supportedPrisonsService.getPrison(selectedEstablishmentId)
      req.context.selectedEstablishment = res.locals.selectedEstablishment
      return next()
    }

    if (selectedEstablishmentId && activeCaseLoadId) {
      logger.info(
        `Redirecting to start: active case load (${activeCaseLoadId}) does not match selected establishment (${selectedEstablishmentId}) for user (${res.locals.user.username})`,
      )
      delete req.session.selectedEstablishmentId
      return res.redirect('/back-to-start')
    }

    if (activeCaseLoadId && (await supportedPrisonsService.isSupportedPrison(activeCaseLoadId))) {
      req.session.selectedEstablishmentId = activeCaseLoadId
      res.locals.selectedEstablishment = await supportedPrisonsService.getPrison(activeCaseLoadId)
      req.context.selectedEstablishment = res.locals.selectedEstablishment
      return next()
    }

    return res.redirect('/establishment-not-supported')
  }
}
