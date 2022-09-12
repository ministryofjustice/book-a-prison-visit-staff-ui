import { format } from 'date-fns'
import { SmsResponse } from 'notifications-node-client'
import { VisitSlot } from '../@types/bapv'
import NotificationsApiClient from '../data/notificationsApiClient'

type NotificationsApiClientBuilder = () => NotificationsApiClient

export default class NotificationsService {
  constructor(private readonly notificationsApiClientBuilder: NotificationsApiClientBuilder) {}

  async sendBookingSms({
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

    return notificationsApiClient.sendBookingSms({
      phoneNumber,
      prisonName,
      visitTime,
      visitDay,
      visitDate,
      reference,
    })
  }

  async sendCancellationSms({
    phoneNumber,
    prisonName,
    visit,
    prisonPhoneNumber,
  }: {
    phoneNumber: string
    prisonName: string
    visit: string
    prisonPhoneNumber: string
  }): Promise<SmsResponse> {
    const notificationsApiClient = this.notificationsApiClientBuilder()
    const parsedDate = new Date(visit)
    const visitTime = format(parsedDate, 'h:mmaaa')
    const visitDate = format(parsedDate, 'd MMMM yyyy')

    return notificationsApiClient.sendCancellationSms({
      phoneNumber,
      prisonName,
      visitTime,
      visitDate,
      prisonPhoneNumber,
    })
  }

  async sendUpdateSms({
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

    return notificationsApiClient.sendUpdateSms({
      phoneNumber,
      prisonName,
      visitTime,
      visitDay,
      visitDate,
      reference,
    })
  }
}
