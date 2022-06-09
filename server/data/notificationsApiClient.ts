import { NotifyClient, SmsResponse } from 'notifications-node-client'
import config from '../config'

export const notificationsApiClientBuilder = (): NotificationsApiClient => {
  const notificationsApiClient = new NotificationsApiClient()

  return notificationsApiClient
}

class NotificationsApiClient {
  private notificationsApiClient: NotifyClient

  constructor() {
    this.notificationsApiClient = new NotifyClient(config.apis.notifications.key)
  }

  async sendSms({
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
    return this.notificationsApiClient.sendSms(config.apis.notifications.templates.bookingConfirmation, phoneNumber, {
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

export default NotificationsApiClient
