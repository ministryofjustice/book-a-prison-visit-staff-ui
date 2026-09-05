import express, { Router } from 'express'

import { monitoringMiddleware, endpointHealthComponent } from '@ministryofjustice/hmpps-monitoring'
import type { ApplicationInfo } from '../applicationInfo'
import logger from '../../logger'
import config from '../config'
import { SupportedPrisonsService } from '../services'

export default function setUpHealthChecks(
  applicationInfo: ApplicationInfo,
  supportedPrisonsService: SupportedPrisonsService,
): Router {
  const router = express.Router()

  const { audit, componentApi, ...otherApis } = config.apis // exclude audit and component APIs from /health
  const apiConfig = Object.entries(otherApis)

  const middleware = monitoringMiddleware({
    applicationInfo,
    healthComponents: apiConfig.map(([name, options]) => endpointHealthComponent(logger, name, options)),
  })

  router.get('/health', middleware.health)

  router.get(
    '/info',
    async (_req, res, next) => {
      try {
        const activeAgencies = await supportedPrisonsService.getActiveAgencies()
        // eslint-disable-next-line no-param-reassign
        applicationInfo.additionalFields = { activeAgencies }
        next()
      } catch {
        res.status(503).send()
      }
    },
    middleware.info,
  )

  router.get('/ping', middleware.ping)

  return router
}
