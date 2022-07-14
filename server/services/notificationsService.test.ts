import NotificationsApiClient from '../data/notificationsApiClient'
import NotificationsService from './notificationsService'

jest.mock('../data/notificationsApiClient')

const notificationsApiClient = new NotificationsApiClient() as jest.Mocked<NotificationsApiClient>

describe('Notifications service', () => {
  let notificationsApiClientBuilder: () => NotificationsApiClient
  let notificationsService: NotificationsService

  beforeEach(() => {
    notificationsApiClientBuilder = jest.fn().mockReturnValue(notificationsApiClient)
    notificationsService = new NotificationsService(notificationsApiClientBuilder)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('sendSms', () => {
    const visitDetails = {
      phoneNumber: '07123456789',
      prisonName: 'Hewell',
      visit: {
        id: '1',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        availableTables: 15,
        visitRoomName: 'room name',
      },
      reference: 'ab-cd-ef-gh',
    }

    it('should call the notifications client with the confirmation and visit details', async () => {
      await notificationsService.sendSms(visitDetails)

      expect(notificationsApiClient.sendSms).toHaveBeenCalledTimes(1)
      expect(notificationsApiClient.sendSms).toHaveBeenCalledWith({
        phoneNumber: visitDetails.phoneNumber,
        prisonName: visitDetails.prisonName,
        visitTime: '10:00am',
        visitDay: 'Monday',
        visitDate: '14 February 2022',
        reference: visitDetails.reference,
      })
    })
  })
})
