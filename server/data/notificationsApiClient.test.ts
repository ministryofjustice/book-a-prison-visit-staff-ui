import config from '../config'
import NotificationsApiClient, { notificationsApiClientBuilder } from './notificationsApiClient'

const { bookingConfirmation, cancellationConfirmation, updateConfirmation } = config.apis.notifications.templates
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

  describe('sendBookingSms', () => {
    const confirmationDetails = {
      phoneNumber: '07123456789',
      prisonName: 'Hewell',
      visitTime: '10:00am',
      visitDay: 'Monday',
      visitDate: '1 August 2022',
      reference: 'ab-cd-ef-gh',
    }

    it('should call notifications client sendBookingSms() with the correct booking confirmation parameters', async () => {
      await notificationsApiClient.sendBookingSms(confirmationDetails)

      expect(mockSendSms).toHaveBeenCalledTimes(1)
      expect(mockSendSms).toHaveBeenCalledWith(bookingConfirmation, confirmationDetails.phoneNumber, {
        personalisation: {
          prison: confirmationDetails.prisonName,
          time: confirmationDetails.visitTime,
          dayofweek: confirmationDetails.visitDay,
          date: confirmationDetails.visitDate,
          'ref number': confirmationDetails.reference,
        },
        reference: confirmationDetails.reference,
      })
    })
  })

  describe('sendCancellationSms', () => {
    const confirmationDetails = {
      phoneNumber: '07123456789',
      prisonPhoneNumber: '01234443225',
      prisonName: 'Hewell',
      visitTime: '10:00am',
      visitDate: '1 August 2022',
    }

    it('should call notifications client sendCancellationSms() with the correct booking cancellation parameters', async () => {
      await notificationsApiClient.sendCancellationSms(confirmationDetails)

      expect(mockSendSms).toHaveBeenCalledTimes(1)
      expect(mockSendSms).toHaveBeenCalledWith(cancellationConfirmation, confirmationDetails.phoneNumber, {
        personalisation: {
          prison: confirmationDetails.prisonName,
          'prison phone number': confirmationDetails.prisonPhoneNumber,
          time: confirmationDetails.visitTime,
          date: confirmationDetails.visitDate,
        },
      })
    })
  })

  describe('sendUpdateSms', () => {
    const confirmationDetails = {
      phoneNumber: '07123456789',
      prisonName: 'Hewell',
      visitTime: '10:00am',
      visitDay: 'Monday',
      visitDate: '1 August 2022',
      reference: 'ab-cd-ef-gh',
    }

    it('should call notifications client sendUpdateSms() with the correct update booking confirmation parameters', async () => {
      await notificationsApiClient.sendUpdateSms(confirmationDetails)

      expect(mockSendSms).toHaveBeenCalledTimes(1)
      expect(mockSendSms).toHaveBeenCalledWith(updateConfirmation, confirmationDetails.phoneNumber, {
        personalisation: {
          prison: confirmationDetails.prisonName,
          time: confirmationDetails.visitTime,
          dayofweek: confirmationDetails.visitDay,
          date: confirmationDetails.visitDate,
          'ref number': confirmationDetails.reference,
        },
        reference: confirmationDetails.reference,
      })
    })
  })
})
