import { format } from 'date-fns'
import { SmsResponse } from 'notifications-node-client'
import { VisitSlot } from '../@types/bapv'
import NotificationsApiClient from '../data/notificationsApiClient'

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
  }): Promise<SmsResponse> {
    const notificationsApiClient = this.notificationsApiClientBuilder()
    const parsedDate = new Date(visit.startTimestamp)
    const visitTime = format(parsedDate, 'h:mmaaa')
    const visitDay = format(parsedDate, 'EEEE')
    const visitDate = format(parsedDate, 'd MMMM yyyy')

    return notificationsApiClient.sendSms({
      phoneNumber,
      prisonName,
      visitTime,
      visitDay,
      visitDate,
      reference,
    })
  }
}
