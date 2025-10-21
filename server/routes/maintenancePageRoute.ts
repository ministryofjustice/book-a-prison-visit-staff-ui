import { Router } from 'express'
import { format, parseISO } from 'date-fns'
import config from '../config'

export default function maintenancePage(): Router {
  const router = Router()
  const { enabled, endDateTime } = config.maintenance

  if (enabled) {
    // Redirect any POST requests back to '/' so a GET made (which will fetch DPS header/footer)
    router.post('*any', (req, res) => res.redirect('/'))

    // Serve maintenance page for any other request
    router.use((req, res) => {
      let maintenanceMessage: string
      try {
        const parsedEndDateTime = parseISO(endDateTime)
        const timeFormat = parsedEndDateTime.getMinutes() === 0 ? 'haaa' : 'h:mmaaa' // 2pm instead of 2:00pm
        const endTime = format(parsedEndDateTime, timeFormat)
        const endDate = format(parsedEndDateTime, 'EEEE d MMMM yyyy')

        maintenanceMessage = `You will be able to use the service from ${endTime} on ${endDate}.`
      } catch {
        maintenanceMessage = 'You will be able to use the service later.'
      }

      return res.render('pages/maintenancePage', { maintenanceMessage })
    })
  }

  return router
}
