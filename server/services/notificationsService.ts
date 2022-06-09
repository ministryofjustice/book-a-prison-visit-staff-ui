import { format } from 'date-fns'
import { VisitSlot } from '../@types/bapv'
import NotificationsApiClient from '../data/notificationsApiClient'
import logger from '../../logger'

type NotificationsApiClientBuilder = () => NotificationsApiClient

export default class NotificationsService {
  constructor(private readonly notificationsApiClientBuilder: NotificationsApiClientBuilder) {}

  async sendSms({
    phoneNumber,
    prisonName,
    visit,
    reference,
  }: {
    phoneNumber: string
    prisonName: string
    visit: VisitSlot
    reference: string
  }): Promise<boolean> {
    const notificationsApiClient = this.notificationsApiClientBuilder()
    const parsedDate = new Date(visit.startTimestamp)
    const visitTime = format(parsedDate, 'h:mmaaa')
    const visitDay = format(parsedDate, 'EEEE')
    const visitDate = format(parsedDate, 'd MMMM yyyy')

    try {
      const a = await notificationsApiClient.sendSms({
        phoneNumber,
        prisonName,
        visitTime,
        visitDay,
        visitDate,
        reference,
      })
      console.log(a)
    } catch (error) {
      logger.error('Failed to send SMS', error)

      return false
    }

    return true
  }
}
