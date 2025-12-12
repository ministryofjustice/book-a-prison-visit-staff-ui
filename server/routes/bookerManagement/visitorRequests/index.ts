import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { Services } from '../../../services'
import { isValidVisitorRequestReference } from '../../validationChecks'

export default function routes(_services: Services): Router {
  const router = Router()

  // middleware to ensure valid visitor request reference
  // for all /manage-bookers/visitor-request/:requestReference routes
  router.use('/:requestReference', (req, res, next) => {
    const { requestReference } = req.params
    if (!isValidVisitorRequestReference(requestReference)) {
      throw new BadRequest()
    }
    next()
  })

  // TODO /:requestReference/link-visitor and other request handling routes

  return router
}
