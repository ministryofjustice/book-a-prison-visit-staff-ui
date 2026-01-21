import { Router } from 'express'

export default function setUpAnalytics(analyticsConfig: {
  enabled?: boolean
  matomoContainerId: string
  matomoSiteId: string
  matomoUrl: string
}): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    res.locals.matomoEnabled = analyticsConfig.enabled
    res.locals.matomoContainerId = analyticsConfig.matomoContainerId
    res.locals.matomoSiteId = analyticsConfig.matomoSiteId
    res.locals.matomoUrl = analyticsConfig.matomoUrl

    next()
  })

  return router
}
