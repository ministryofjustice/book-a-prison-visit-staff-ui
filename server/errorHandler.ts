import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    if (error.status === 401 || error.status === 403) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    const heading = error.status === 404 ? 'Page not found' : 'Error'
    const prodMessage =
      error.status === 404
        ? [
            'If you typed the web address, check it is correct.',
            'If you pasted the web address, check you copied the entire address.',
          ]
        : ['Something went wrong. The error has been logged. Please try again']
    const showHomeButton = error.status === 404

    res.locals.heading = heading
    res.locals.message = prodMessage
    res.locals.showHomeButton = showHomeButton
    res.locals.stack = production ? null : error.stack
    res.locals.errorMessage = production ? null : error.message

    res.status(error.status || 500)

    return res.render('pages/error')
  }
}
