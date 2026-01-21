import { Router } from 'express'

export default function setUpAnalytics(
  matomoContainerId: string,
  matomoSiteId: string,
  matomoEnabled: boolean,
): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    res.locals.matomoEnabled = matomoEnabled
    res.locals.matomoContainerId = matomoContainerId
    res.locals.matomoSiteId = matomoSiteId

    next()
  })

  return router
}
