import { jwtDecode } from 'jwt-decode'
import express from 'express'
import { convertToTitleCase } from '../utils/utils'
import logger from '../../logger'

export default function setUpCurrentUser() {
  const router = express.Router()

  router.use((req, res, next) => {
    try {
      const {
        name,
        user_id: userId,
        authorities: roles = [],
      } = jwtDecode(res.locals.user.token) as {
        name?: string
        user_id?: string
        authorities?: string[]
      }

      // feComponents only populated on GET requests, so fall back to already selected establishment
      const activeCaseLoadId =
        res.locals.feComponents?.sharedData?.activeCaseLoad?.caseLoadId ?? req.session?.selectedEstablishment?.prisonId

      res.locals.user = {
        ...res.locals.user,
        userId,
        name,
        displayName: convertToTitleCase(name || ''),
        userRoles: roles.map(role => role.substring(role.indexOf('_') + 1)),
        activeCaseLoadId,
      }

      if (res.locals.user.authSource === 'nomis') {
        const parsedStaffId = userId !== undefined ? parseInt(userId, 10) : NaN
        res.locals.user.staffId = Number.isFinite(parsedStaffId) ? parsedStaffId : undefined
      }

      next()
    } catch (error) {
      logger.error(error, `Failed to populate user details for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  })

  return router
}
