import config from '../config'
import NotificationsApiClient, { notificationsApiClientBuilder } from './notificationsApiClient'

const mockSendSms = jest.fn()

jest.mock('notifications-node-client', () => {
  return {
    NotifyClient: jest.fn().mockImplementation(() => {
      return { sendSms: mockSendSms }
    }),
  }
})

describe('GOV.UK Notify client', () => {
  let notificationsApiClient: NotificationsApiClient

  beforeEach(() => {
    notificationsApiClient = notificationsApiClientBuilder()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('sendSms', () => {
    const confirmationDetails = {
      phoneNumber: '07123456789',
      prisonName: 'Hewell',
      visitTime: '10:00am',
      visitDay: 'Monday',
      visitDate: '1 August 2022',
      reference: 'ab-cd-ef-gh',
    }

    it('should call notifications client sendSms() with the correct booking confirmation parameters', async () => {
      await notificationsApiClient.sendSms(confirmationDetails)

      expect(mockSendSms).toHaveBeenCalledTimes(1)
      expect(mockSendSms).toHaveBeenCalledWith(
        config.apis.notifications.templates.bookingConfirmation,
        confirmationDetails.phoneNumber,
        {
          personalisation: {
            prison: confirmationDetails.prisonName,
            time: confirmationDetails.visitTime,
            dayofweek: confirmationDetails.visitDay,
            date: confirmationDetails.visitDate,
            'ref number': confirmationDetails.reference,
          },
          reference: confirmationDetails.reference,
        },
      )
    })
  })
})
