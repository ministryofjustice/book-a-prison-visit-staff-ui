import { format } from 'date-fns'
import { SmsResponse } from 'notifications-node-client'
import { VisitSlot } from '../@types/bapv'
import { NotificationsApiClient } from '../data'

type NotificationsApiClientBuilder = () => NotificationsApiClient

export default class NotificationsService {
  constructor(private readonly notificationsApiClientBuilder: NotificationsApiClientBuilder) {}

  async sendBookingSms({
    phoneNumber,
    prisonName,
    visitSlot,
    reference,
  }: {
    phoneNumber: string
    prisonName: string
    visitSlot: VisitSlot
    reference: string
  }): Promise<SmsResponse> {
    const notificationsApiClient = this.notificationsApiClientBuilder()
    const parsedDate = new Date(visitSlot.startTimestamp)
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
    visitSlot,
    prisonPhoneNumber,
    reference,
  }: {
    phoneNumber: string
    prisonName: string
    visitSlot: string
    prisonPhoneNumber: string
    reference: string
  }): Promise<SmsResponse> {
    const notificationsApiClient = this.notificationsApiClientBuilder()
    const parsedDate = new Date(visitSlot)
    const visitTime = format(parsedDate, 'h:mmaaa')
    const visitDate = format(parsedDate, 'd MMMM yyyy')

    return notificationsApiClient.sendCancellationSms({
      phoneNumber,
      prisonName,
      visitTime,
      visitDate,
      prisonPhoneNumber,
      reference,
    })
  }

  async sendUpdateSms({
    phoneNumber,
    prisonName,
    visitSlot,
    reference,
  }: {
    phoneNumber: string
    prisonName: string
    visitSlot: VisitSlot
    reference: string
  }): Promise<SmsResponse> {
    const notificationsApiClient = this.notificationsApiClientBuilder()
    const parsedDate = new Date(visitSlot.startTimestamp)
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
