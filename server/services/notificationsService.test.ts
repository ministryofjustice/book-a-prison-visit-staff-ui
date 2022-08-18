import { VisitSlot } from '../@types/bapv'
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

  describe('sendBookingSms', () => {
    const visitDetails = {
      phoneNumber: '07123456789',
      prisonName: 'Hewell',
      visit: {
        id: '1',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        availableTables: 15,
        visitRoomName: 'room name',
        visitRestriction: 'OPEN',
      } as VisitSlot,
      reference: 'ab-cd-ef-gh',
    }

    it('should call the notifications client with the confirmation and visit details', async () => {
      await notificationsService.sendBookingSms(visitDetails)

      expect(notificationsApiClient.sendBookingSms).toHaveBeenCalledTimes(1)
      expect(notificationsApiClient.sendBookingSms).toHaveBeenCalledWith({
        phoneNumber: visitDetails.phoneNumber,
        prisonName: visitDetails.prisonName,
        visitTime: '10:00am',
        visitDay: 'Monday',
        visitDate: '14 February 2022',
        reference: visitDetails.reference,
      })
    })
  })

  describe('sendCancellationSms', () => {
    const visitDetails = {
      phoneNumber: '07123456789',
      prisonName: 'Hewell',
      prisonPhoneNumber: '01234443225',
      visit: '2022-02-14T10:00:00',
    }

    it('should call the notifications client with the cancellation details', async () => {
      await notificationsService.sendCancellationSms(visitDetails)

      expect(notificationsApiClient.sendCancellationSms).toHaveBeenCalledTimes(1)
      expect(notificationsApiClient.sendCancellationSms).toHaveBeenCalledWith({
        phoneNumber: visitDetails.phoneNumber,
        prisonPhoneNumber: visitDetails.prisonPhoneNumber,
        prisonName: visitDetails.prisonName,
        visitTime: '10:00am',
        visitDate: '14 February 2022',
      })
    })
  })
})
