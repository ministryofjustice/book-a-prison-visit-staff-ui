import { Router } from 'express'
import auth from '../authentication/auth'
import tokenVerifier from '../data/tokenVerification'
import populateCurrentUser from './populateCurrentUser'
import populateSelectedEstablishment from './populateSelectedEstablishment'
import type { Services } from '../services'

export default function setUpCurrentUser({ userService, supportedPrisonsService }: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(auth.authenticationMiddleware(tokenVerifier))
  router.use(populateCurrentUser(userService))
  router.use(populateSelectedEstablishment(supportedPrisonsService))
  return router
}
