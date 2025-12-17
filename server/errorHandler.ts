import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import { getFrontendComponents } from '@ministryofjustice/hmpps-connect-dps-components'
import logger from '../logger'
import { errorHasStatus, getErrorStatus } from './utils/errorHelpers'
import config from './config'

export default function createErrorHandler(production: boolean) {
  return async (error: HTTPError | SanitisedError, req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    if (errorHasStatus(error, 401) || errorHasStatus(error, 403)) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    if (req.method === 'POST') {
      try {
        await getFrontendComponents({
          logger,
          componentApiConfig: config.apis.componentApi,
          dpsUrl: config.dpsHome,
          requestOptions: { includeSharedData: true },
        })(req, res, next)
      } catch (err) {
        logger.error('Error fetching frontend components while handling failed POST request', err)
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
