import type { RequestHandler } from 'express'
import { Services } from '../services'
import logger from '../../logger'
import { Prison } from '../@types/bapv'

export default function populateSelectedEstablishment({ supportedPrisonsService }: Services): RequestHandler {
  return async (req, res, next) => {
    if (req.path === '/establishment-not-supported') {
      return next()
    }

    const { selectedEstablishment } = req.session
    const { activeCaseLoadId } = res.locals.user
    const establishmentAndCaseLoadMatch = selectedEstablishment?.prisonId === activeCaseLoadId

    if (establishmentAndCaseLoadMatch || (selectedEstablishment && !activeCaseLoadId)) {
      res.locals.selectedEstablishment = selectedEstablishment
      return next()
    }

    if (selectedEstablishment && activeCaseLoadId) {
      logger.info(
        `Redirecting to start: active case load (${activeCaseLoadId}) does not match selected establishment (${selectedEstablishment.prisonId}) for user (${res.locals.user.username})`,
      )
      delete req.session.selectedEstablishment
      return res.redirect('/back-to-start')
    }

    if (
      activeCaseLoadId &&
      (await supportedPrisonsService.isSupportedPrison(res.locals.user.username, activeCaseLoadId))
    ) {
      const prison = await supportedPrisonsService.getPrison(res.locals.user.username, activeCaseLoadId)

      req.session.selectedEstablishment = { ...prison, isEnabledForPublic: isPrisonEnabledForPublic(prison) }

      res.locals.selectedEstablishment = req.session.selectedEstablishment
      return next()
    }

    return res.redirect('/establishment-not-supported')
  }
}

function isPrisonEnabledForPublic(prison: Prison): boolean {
  return prison.clients.some(client => client.userType === 'PUBLIC' && client.active)
}
