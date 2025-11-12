import { Router } from 'express'

import { Services } from '../services'

export default function routes({ supportedPrisonsService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const activeCaseLoad = res.locals.feComponents?.sharedData?.activeCaseLoad

    if (
      !activeCaseLoad ||
      (await supportedPrisonsService.isSupportedPrison(res.locals.user.username, activeCaseLoad.caseLoadId))
    ) {
      return res.redirect('/')
    }

    return res.render('pages/establishmentNotSupported', { prisonName: activeCaseLoad.description })
  })

  return router
}
