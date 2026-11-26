import { Router } from 'express'
import { Services } from '../../services'
import RecordAttendanceListingController from './recordAttendanceListingController'
import config from '../../config'

export default function routes(_services: Services): Router {
  const router = Router()

  if (config.features.recordAttendance) {
    const recordAttendanceListing = new RecordAttendanceListingController()
    router.get('/', recordAttendanceListing.view())
  }

  return router
}
