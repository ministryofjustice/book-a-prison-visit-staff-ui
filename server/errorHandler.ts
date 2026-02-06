import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import { getFrontendComponents } from '@ministryofjustice/hmpps-connect-dps-components'
import logger from '../logger'
import { errorHasStatus, getErrorStatus } from './utils/errorHelpers'
import config from './config'

const feComponentsMiddleware = getFrontendComponents({
  dpsUrl: config.dpsHome,
  logger,
  componentApiConfig: config.apis.componentApi,
  requestOptions: { includeSharedData: true },
})

export default function createErrorHandler(production: boolean) {
  return async (error: HTTPError | SanitisedError, req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    if (errorHasStatus(error, 401) || errorHasStatus(error, 403)) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    if (req.method === 'POST') {
      try {
        await new Promise<void>((resolve, reject) => {
          feComponentsMiddleware(req, res, (e?) => (e ? reject(e) : resolve()))
        })
      } catch (e) {
        logger.warn('Failed to get front-end components while handling POST error', e)
      }
    }

    const heading = errorHasStatus(error, 404) ? 'Page not found' : 'Error'
    const prodMessage = errorHasStatus(error, 404)
      ? [
          'If you typed the web address, check it is correct.',
          'If you pasted the web address, check you copied the entire address.',
        ]
      : ['Something went wrong. The error has been logged. Please try again']
    const showHomeButton = errorHasStatus(error, 404)

    res.locals.heading = heading
    res.locals.message = prodMessage
    res.locals.showHomeButton = showHomeButton
    res.locals.stack = production ? null : error.stack
    res.locals.errorMessage = production ? null : error.message

    res.status(getErrorStatus(error) || 500)

    return res.render('pages/error')
  }
}
