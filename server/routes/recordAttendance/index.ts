import { Router } from 'express'
import { Services } from '../../services'
import RecordAttendanceListController from './recordAttendanceListController'
import config from '../../config'

export default function routes(_services: Services): Router {
  const router = Router()

  if (config.features.recordAttendance) {
    const recordAttendanceList = new RecordAttendanceListController()
    router.get('/', recordAttendanceList.view())
  }

  return router
}
