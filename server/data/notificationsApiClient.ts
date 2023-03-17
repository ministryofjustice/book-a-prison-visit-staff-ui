import { NotifyClient, SmsResponse } from 'notifications-node-client'
import logger from '../../logger'
import config from '../config'

const { key, templates } = config.apis.notifications

export default class NotificationsApiClient {
  private notificationsApiClient: NotifyClient

  constructor() {
    this.notificationsApiClient = new NotifyClient(key)
  }

  async sendBookingSms({
    phoneNumber,
    prisonName,
    visitTime,
    visitDay,
    visitDate,
    reference,
  }: {
    phoneNumber: string
    prisonName: string
    visitTime: string
    visitDay: string
    visitDate: string
    reference: string
  }): Promise<SmsResponse> {
    logger.info(`Sending Booking SMS for ${reference}`)
    return this.notificationsApiClient.sendSms(templates.bookingConfirmation, phoneNumber, {
      personalisation: {
        prison: prisonName,
        time: visitTime,
        dayofweek: visitDay,
        date: visitDate,
        'ref number': reference,
      },
      reference,
    })
  }

  async sendCancellationSms({
    phoneNumber,
    prisonName,
    visitTime,
    visitDate,
    prisonPhoneNumber,
    reference,
  }: {
    phoneNumber: string
    prisonName: string
    visitTime: string
    visitDate: string
    prisonPhoneNumber: string
    reference: string
  }): Promise<SmsResponse> {
    return this.notificationsApiClient.sendSms(templates.cancellationConfirmation, phoneNumber, {
      personalisation: {
        prison: prisonName,
        time: visitTime,
        date: visitDate,
        'prison phone number': prisonPhoneNumber,
        reference,
      },
    })
  }

  async sendUpdateSms({
    phoneNumber,
    prisonName,
    visitTime,
    visitDay,
    visitDate,
    reference,
  }: {
    phoneNumber: string
    prisonName: string
    visitTime: string
    visitDay: string
    visitDate: string
    reference: string
  }): Promise<SmsResponse> {
    logger.info(`Sending Update SMS for ${reference}`)
    return this.notificationsApiClient.sendSms(templates.updateConfirmation, phoneNumber, {
      personalisation: {
        prison: prisonName,
        time: visitTime,
        dayofweek: visitDay,
        date: visitDate,
        'ref number': reference,
      },
      reference,
    })
  }
}
