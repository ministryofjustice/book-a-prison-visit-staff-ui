import { Router } from 'express'
import csurf from 'csurf'
import auth from '../authentication/auth'
import tokenVerifier from '../data/tokenVerification'
import populateCurrentUser from '../middleware/populateCurrentUser'
import populateSelectedEstablishment from '../middleware/populateSelectedEstablishment'
import type UserService from '../services/userService'
import SupportedPrisonsService from '../services/supportedPrisonsService'

const testMode = process.env.NODE_ENV === 'test'

export default function standardRouter(
  userService: UserService,
  supportedPrisonsService: SupportedPrisonsService,
): Router {
  const router = Router({ mergeParams: true })

  router.use(auth.authenticationMiddleware(tokenVerifier))
  router.use(populateCurrentUser(userService))
  router.use(populateSelectedEstablishment(supportedPrisonsService))

  // CSRF protection
  if (!testMode) {
    router.use(csurf())
  }

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  return router
}
