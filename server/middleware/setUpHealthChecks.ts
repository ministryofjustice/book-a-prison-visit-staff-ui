import express, { Router } from 'express'

import healthcheck from '../services/healthCheck'
import type { ApplicationInfo } from '../applicationInfo'
import { SupportedPrisonsService } from '../services'
import logger from '../../logger'

export default function setUpHealthChecks(
  applicationInfo: ApplicationInfo,
  supportedPrisonsService: SupportedPrisonsService,
): Router {
  const router = express.Router()

  router.get('/health', (req, res, next) => {
    healthcheck(applicationInfo, result => {
      if (!result.healthy) {
        res.status(503)
      }
      res.json(result)
    })
  })

  router.get('/ping', (req, res) =>
    res.send({
      status: 'UP',
    }),
  )

  router.get('/info', async (req, res) => {
    let activeAgencies: string[]
    try {
      activeAgencies = await supportedPrisonsService.getActiveAgencies()
    } catch (error) {
      logger.error(error, 'Error retrieving activeAgencies')
      activeAgencies = []
    }

    res.json({
      git: {
        branch: applicationInfo.branchName,
      },
      build: {
        artifact: applicationInfo.applicationName,
        version: applicationInfo.buildNumber,
        name: applicationInfo.applicationName,
      },
      productId: applicationInfo.productId,
      activeAgencies,
    })
  })

  return router
}
