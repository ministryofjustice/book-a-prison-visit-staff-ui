import { RequestHandler } from 'express'
import { Services } from '../services'
import logger from '../../logger'

export default function getFrontendComponents({ frontendComponentsService }: Services): RequestHandler {
  return async (req, res, next) => {
    try {
      const { footer } = await frontendComponentsService.getComponents(['footer'], res.locals.user.token)

      res.locals.feComponents = {
        footer: footer.html,
        cssIncludes: [...footer.css],
        jsIncludes: [...footer.javascript],
      }
      next()
    } catch (error) {
      logger.error(error, 'Failed to retrieve front end components')
      next()
    }
  }
}
