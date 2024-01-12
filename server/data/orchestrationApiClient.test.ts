import nock from 'nock'
import config from '../config'
import TestData from '../routes/testutils/testData'
import OrchestrationApiClient from './orchestrationApiClient'
import {
  BookingOrchestrationRequestDto,
  CancelVisitOrchestrationDto,
  ChangeVisitSlotRequestDto,
  NotificationType,
  ReserveVisitSlotDto,
  SessionSchedule,
  Visit,
} from './orchestrationApiTypes'
import { VisitSessionData } from '../@types/bapv'

describe('orchestrationApiClient', () => {
  let fakeOrchestrationApi: nock.Scope
  let orchestrationApiClient: OrchestrationApiClient
  const token = 'token-1'
  const prisonId = 'HEI'

  beforeEach(() => {
    fakeOrchestrationApi = nock(config.apis.orchestration.url)
    orchestrationApiClient = new OrchestrationApiClient(token)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('bookVisit', () => {
    it('should book a Visit (change status from RESERVED to BOOKED), given applicationReference', async () => {
      const applicationReference = 'aaa-bbb-ccc'
      const bookingOrchestrationRequestDto: BookingOrchestrationRequestDto = {
        applicationMethodType: 'NOT_KNOWN',
      }

      const result: Partial<Visit> = {
        applicationReference,
        reference: 'ab-cd-ef-gh',
        visitStatus: 'BOOKED',
      }

      fakeOrchestrationApi
        .put(`/visits/${applicationReference}/book`, bookingOrchestrationRequestDto)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await orchestrationApiClient.bookVisit(
        applicationReference,
        bookingOrchestrationRequestDto.applicationMethodType,
      )

      expect(output).toEqual(result)
    })
  })

  describe('cancelVisit', () => {
    it('should cancel visit with the specified outcome', async () => {
      const reference = 'ab-cd-ef-gh'

      const cancelVisitDto: CancelVisitOrchestrationDto = {
        cancelOutcome: {
          outcomeStatus: 'VISITOR_CANCELLED',
          text: 'cancellation reason',
        },
        applicationMethodType: 'NOT_KNOWN',
      }

      const result: Visit = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        prisonerId: 'AF34567G',
        prisonId: 'HEI',
        visitRoom: 'A1 L3',
        visitType: 'SOCIAL',
        visitStatus: 'CANCELLED',
        visitRestriction: 'OPEN',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        visitNotes: [
          {
            type: 'VISIT_OUTCOMES',
            text: 'VISITOR_CANCELLED',
          },
          {
            type: 'STATUS_CHANGED_REASON',
            text: 'cancellation reason',
          },
        ],
        visitors: [
          {
            nomisPersonId: 1234,
          },
        ],
        visitorSupport: [],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }
      fakeOrchestrationApi
        .put(`/visits/ab-cd-ef-gh/cancel`, cancelVisitDto)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await orchestrationApiClient.cancelVisit(reference, cancelVisitDto)

      expect(output).toEqual(result)
    })
  })

  describe('changeBookedVisit', () => {
    it('should return the Visit with new status of RESERVED/CHANGING and new applicationReference', async () => {
      const visitType = 'SOCIAL'
      const sessionTemplateReference = 'v9d.7ed.7u'

      const visitSessionData = <VisitSessionData>{
        prisoner: {
          offenderNo: 'AF34567G',
          name: 'prisoner name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        visitSlot: {
          id: '1',
          sessionTemplateReference,
          prisonId,
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
          availableTables: 1,
          capacity: 1,
          visitRoom: 'A1 L3',
        },
        visitRestriction: 'OPEN',
        visitors: [
          {
            personId: 123,
            name: 'visitor name',
            relationshipDescription: 'relationship desc',
            restrictions: [],
            banned: false,
          },
        ],
        visitorSupport: [],
        mainContact: {
          phoneNumber: '01234 567890',
          contactName: 'John Smith',
          contact: {
            personId: 123,
          },
        },
        applicationReference: 'aaa-bbb-ccc',
        visitReference: 'ab-cd-ef-gh',
        visitStatus: 'BOOKED',
      }

      const result: Visit = {
        applicationReference: 'ddd-eee-fff',
        reference: visitSessionData.visitReference,
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId,
        sessionTemplateReference: 'v9d.7ed.7u',
        visitRoom: visitSessionData.visitSlot.visitRoom,
        visitType,
        visitStatus: 'CHANGING',
        visitRestriction: visitSessionData.visitRestriction,
        startTimestamp: visitSessionData.visitSlot.startTimestamp,
        endTimestamp: visitSessionData.visitSlot.endTimestamp,
        visitNotes: [],
        visitContact: {
          name: 'John Smith',
          telephone: '01234 567890',
        },
        visitors: [
          {
            nomisPersonId: 123,
            visitContact: true,
          },
        ],
        visitorSupport: [],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }

      fakeOrchestrationApi
        .put(`/visits/${visitSessionData.visitReference}/change`, <ReserveVisitSlotDto>{
          prisonerId: visitSessionData.prisoner.offenderNo,
          sessionTemplateReference: 'v9d.7ed.7u',
          visitRestriction: visitSessionData.visitRestriction,
          startTimestamp: visitSessionData.visitSlot.startTimestamp,
          endTimestamp: visitSessionData.visitSlot.endTimestamp,
          visitContact: {
            name: visitSessionData.mainContact.contactName,
            telephone: visitSessionData.mainContact.phoneNumber,
          },
          visitors: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
              visitContact: true,
            }
          }),
          visitorSupport: visitSessionData.visitorSupport,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(201, result)

      const output = await orchestrationApiClient.changeBookedVisit(visitSessionData)

      expect(output).toEqual(result)
    })
  })

  describe('changeReservedVisit', () => {
    const visitType = 'SOCIAL'
    const visitStatus = 'RESERVED'

    it('should return a changed reserved Visit given full visitSessionData', async () => {
      const result: Visit = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        prisonerId: 'AF34567G',
        prisonId,
        sessionTemplateReference: 'v9d.7ed.7u',
        visitRoom: 'A1 L3',
        visitType,
        visitStatus,
        visitRestriction: 'OPEN',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        visitNotes: [],
        visitContact: {
          name: 'John Smith',
          telephone: '01234 567890',
        },
        visitors: [
          {
            nomisPersonId: 1234,
            visitContact: false,
          },
        ],
        visitorSupport: [
          { type: 'WHEELCHAIR' },
          { type: 'MASK_EXEMPT' },
          {
            type: 'OTHER',
            text: 'custom request',
          },
        ],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }

      const visitSessionData: VisitSessionData = {
        prisoner: {
          offenderNo: result.prisonerId,
          name: 'prisoner name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        visitSlot: {
          id: '1',
          sessionTemplateReference: 'v9d.7ed.7u',
          prisonId,
          startTimestamp: result.startTimestamp,
          endTimestamp: result.endTimestamp,
          availableTables: 1,
          capacity: 30,
          visitRoom: result.visitRoom,
          visitRestriction: 'OPEN',
        },
        visitRestriction: 'OPEN',
        visitors: [
          {
            personId: 123,
            name: 'visitor name',
            adult: true,
            relationshipDescription: 'relationship desc',
            restrictions: [
              {
                restrictionType: 'TEST',
                restrictionTypeDescription: 'test type',
                startDate: '10 May 2020',
                expiryDate: '10 May 2022',
                globalRestriction: false,
                comment: 'comments',
              },
            ],
            banned: false,
          },
        ],
        visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'MASK_EXEMPT' }, { type: 'OTHER', text: 'custom request' }],
        mainContact: {
          phoneNumber: result.visitContact.telephone,
          contactName: result.visitContact.name,
        },
        applicationReference: 'aaa-bbb-ccc',
        visitReference: 'ab-cd-ef-gh',
        visitStatus,
      }
      const visitContact = {
        telephone: visitSessionData.mainContact.phoneNumber,
        name: visitSessionData.mainContact.contactName,
      }

      fakeOrchestrationApi
        .put('/visits/aaa-bbb-ccc/slot/change', <ChangeVisitSlotRequestDto>{
          visitRestriction: visitSessionData.visitRestriction,
          startTimestamp: visitSessionData.visitSlot.startTimestamp,
          endTimestamp: visitSessionData.visitSlot.endTimestamp,
          visitContact,
          visitors: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
              visitContact: false,
            }
          }),
          visitorSupport: visitSessionData.visitorSupport,
          sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await orchestrationApiClient.changeReservedVisit(visitSessionData)

      expect(output).toEqual(result)
    })

    it('should return an updated reserved Visit given minimal visitSessionData', async () => {
      const result: Visit = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        prisonerId: 'AF34567G',
        prisonId,
        sessionTemplateReference: 'v9d.7ed.7u',
        visitRoom: 'A1 L3',
        visitType,
        visitStatus,
        visitRestriction: 'OPEN',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        visitNotes: [],
        visitors: [
          {
            nomisPersonId: 1234,
            visitContact: false,
          },
        ],
        visitorSupport: [],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }
      const visitSessionData: VisitSessionData = {
        prisoner: {
          offenderNo: result.prisonerId,
          name: 'prisoner name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        visitSlot: {
          id: '1',
          sessionTemplateReference: 'v9d.7ed.7u',
          prisonId,
          startTimestamp: result.startTimestamp,
          endTimestamp: result.endTimestamp,
          availableTables: 1,
          capacity: 30,
          visitRoom: result.visitRoom,
          visitRestriction: 'OPEN',
        },
        visitRestriction: 'OPEN',
        visitors: [
          {
            personId: 123,
            name: 'visitor name',
            adult: true,
            relationshipDescription: 'relationship desc',
            restrictions: [
              {
                restrictionType: 'TEST',
                restrictionTypeDescription: 'test type',
                startDate: '10 May 2020',
                expiryDate: '10 May 2022',
                globalRestriction: false,
                comment: 'comments',
              },
            ],
            banned: false,
          },
        ],
        applicationReference: 'aaa-bbb-ccc',
        visitReference: 'ab-cd-ef-gh',
        visitStatus,
      }

      fakeOrchestrationApi
        .put('/visits/aaa-bbb-ccc/slot/change', <ChangeVisitSlotRequestDto>{
          visitRestriction: visitSessionData.visitRestriction,
          startTimestamp: visitSessionData.visitSlot.startTimestamp,
          endTimestamp: visitSessionData.visitSlot.endTimestamp,
          visitContact: undefined,
          visitors: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
              visitContact: false,
            }
          }),
          visitorSupport: undefined,
          sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await orchestrationApiClient.changeReservedVisit(visitSessionData)

      expect(output).toEqual(result)
    })
  })

  describe('reserveVisit', () => {
    it('should return a new Visit', async () => {
      const visitType = 'SOCIAL'
      const visitStatus = 'RESERVED'
      const visitRestriction = 'OPEN'
      const startTimestamp = '2022-02-14T10:00:00'
      const endTimestamp = '2022-02-14T11:00:00'
      const sessionTemplateReference = 'v9d.7ed.7u'

      const result: Visit = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        prisonerId: 'AF34567G',
        prisonId,
        sessionTemplateReference,
        visitRoom: 'A1 L3',
        visitType,
        visitStatus,
        visitRestriction,
        startTimestamp,
        endTimestamp,
        visitNotes: [],
        visitors: [
          {
            nomisPersonId: 1234,
          },
        ],
        visitorSupport: [],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }
      const visitSessionData = <VisitSessionData>{
        prisoner: {
          offenderNo: result.prisonerId,
          name: 'prisoner name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        visitSlot: {
          id: '1',
          sessionTemplateReference,
          prisonId,
          startTimestamp,
          endTimestamp,
          availableTables: 1,
          capacity: 1,
          visitRoom: result.visitRoom,
        },
        visitRestriction: 'OPEN',
        visitors: [
          {
            personId: 123,
            name: 'visitor name',
            relationshipDescription: 'rel desc',
            restrictions: [],
            banned: false,
          },
        ],
      }

      fakeOrchestrationApi
        .post('/visits/slot/reserve', <ReserveVisitSlotDto>{
          prisonerId: visitSessionData.prisoner.offenderNo,
          sessionTemplateReference,
          visitRestriction,
          startTimestamp,
          endTimestamp,
          visitors: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
            }
          }),
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(201, result)

      const output = await orchestrationApiClient.reserveVisit(visitSessionData)

      expect(output).toEqual(result)
    })
  })

  describe('getVisit', () => {
    it('should return a single matching Visit for a valid reference', async () => {
      const visit = TestData.visit()

      fakeOrchestrationApi
        .get(`/visits/${visit.reference}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visit)

      const output = await orchestrationApiClient.getVisit(visit.reference)

      expect(output).toEqual(visit)
    })
  })

  describe('getVisitHistory', () => {
    it('should return visit history details for requested visit', async () => {
      const visitHistoryDetails = TestData.visitHistoryDetails()

      fakeOrchestrationApi
        .get(`/visits/${visitHistoryDetails.visit.reference}/history`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitHistoryDetails)

      const output = await orchestrationApiClient.getVisitHistory(visitHistoryDetails.visit.reference)

      expect(output).toEqual(visitHistoryDetails)
    })
  })

  describe('getUpcomingVisits', () => {
    it('should return an array of Visits', async () => {
      const timestamp = new Date().toISOString()
      const offenderNo = 'A1234BC'
      const results: Visit[] = [
        {
          applicationReference: 'aaa-bbb-ccc',
          reference: 'ab-cd-ef-gh',
          prisonerId: offenderNo,
          prisonId: 'HEI',
          visitRoom: 'A1 L3',
          visitType: 'SOCIAL',
          visitStatus: 'RESERVED',
          visitRestriction: 'OPEN',
          startTimestamp: timestamp,
          endTimestamp: '',
          visitNotes: [],
          visitors: [
            {
              nomisPersonId: 1234,
            },
          ],
          visitorSupport: [
            {
              type: 'OTHER',
              text: 'custom support details',
            },
          ],
          createdTimestamp: '2022-02-14T10:00:00',
          modifiedTimestamp: '2022-02-14T10:05:00',
        },
      ]

      jest.useFakeTimers({ advanceTimers: true, now: new Date(timestamp) })

      fakeOrchestrationApi
        .get('/visits/search')
        .query({
          prisonerId: offenderNo,
          startDateTime: timestamp,
          visitStatus: 'BOOKED,CANCELLED',
          page: '0',
          size: '1000',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await orchestrationApiClient.getUpcomingVisits(offenderNo, ['BOOKED', 'CANCELLED'])

      expect(output).toEqual(results)

      jest.useRealTimers()
    })
  })

  describe('getVisitsByDate', () => {
    it('should return an array of Visits', async () => {
      const dateString = '2022-05-06'
      const results: Visit[] = [
        {
          applicationReference: 'aaa-bbb-ccc',
          reference: 'ab-cd-ef-gh',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          visitRoom: 'A1 L3',
          visitType: 'SOCIAL',
          visitStatus: 'RESERVED',
          visitRestriction: 'OPEN',
          startTimestamp: `${dateString}T10:00:00`,
          endTimestamp: '',
          visitNotes: [],
          visitors: [
            {
              nomisPersonId: 1234,
            },
          ],
          visitorSupport: [
            {
              type: 'OTHER',
              text: 'custom support details',
            },
          ],
          createdTimestamp: '2022-02-14T10:00:00',
          modifiedTimestamp: '2022-02-14T10:05:00',
        },
      ]

      fakeOrchestrationApi
        .get('/visits/search')
        .query({
          prisonId: 'HEI',
          startDateTime: `${dateString}T00:00:00`,
          endDateTime: `${dateString}T23:59:59`,
          visitStatus: 'BOOKED',
          page: '0',
          size: '1000',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await orchestrationApiClient.getVisitsByDate(dateString, prisonId)

      expect(output).toEqual(results)
    })
  })

  describe('getAvailableSupportOptions', () => {
    it('should return an array of available support types', async () => {
      const results = TestData.supportTypes()

      fakeOrchestrationApi.get('/visit-support').matchHeader('authorization', `Bearer ${token}`).reply(200, results)

      const output = await orchestrationApiClient.getAvailableSupportOptions()

      expect(output).toEqual(results)
    })
  })

  describe('getNotificationCount', () => {
    it('should return notification count for given prison', async () => {
      const notificationCount = TestData.notificationCount()

      fakeOrchestrationApi
        .get(`/visits/notification/${prisonId}/count`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, notificationCount)

      const output = await orchestrationApiClient.getNotificationCount(prisonId)

      expect(output).toEqual(notificationCount)
    })
  })

  describe('getNotificationGroups', () => {
    it('should return notification groups for given prison', async () => {
      const notificationGroups = [TestData.notificationGroup()]

      fakeOrchestrationApi
        .get(`/visits/notification/${prisonId}/groups`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, notificationGroups)

      const output = await orchestrationApiClient.getNotificationGroups(prisonId)

      expect(output).toEqual(notificationGroups)
    })
  })

  describe('getVisitNotifications', () => {
    it('should return notifications for a given visit reference', async () => {
      const notifications: NotificationType[] = ['NON_ASSOCIATION_EVENT']

      fakeOrchestrationApi
        .get(`/visits/notification/visit/ab-cd-ef-gh/types`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, notifications)

      const output = await orchestrationApiClient.getVisitNotifications('ab-cd-ef-gh')

      expect(output).toStrictEqual(notifications)
    })
  })

  describe('getVisitSessions', () => {
    it('should return an array of Visit Sessions', async () => {
      const results = [TestData.visitSession()]

      fakeOrchestrationApi
        .get('/visit-sessions')
        .query({
          prisonId: 'HEI',
          prisonerId: 'A1234BC',
          min: '2',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await orchestrationApiClient.getVisitSessions('A1234BC', prisonId, '2')

      expect(output).toEqual(results)
    })
  })

  describe('getSessionSchedule', () => {
    it('should return an array of scheduled sessions for the specified prison and date', async () => {
      const date = '2023-02-01'
      const sessionSchedule: SessionSchedule[] = [TestData.sessionSchedule()]

      fakeOrchestrationApi
        .get('/visit-sessions/schedule')
        .query({ prisonId, date })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, sessionSchedule)

      const output = await orchestrationApiClient.getSessionSchedule(prisonId, date)

      expect(output).toEqual(sessionSchedule)
    })
  })

  describe('getVisitSessionCapacity', () => {
    const sessionDate = '2023-01-31'
    const sessionStartTime = '10:00:00'
    const sessionEndTime = '11:00:00'

    it('should return the open and closed capacity for the specified visit session', async () => {
      const sessionCapacity = TestData.sessionCapacity()

      fakeOrchestrationApi
        .get('/visit-sessions/capacity')
        .query({ prisonId, sessionDate, sessionStartTime, sessionEndTime })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, sessionCapacity)

      const output = await orchestrationApiClient.getVisitSessionCapacity(
        prisonId,
        sessionDate,
        sessionStartTime,
        sessionEndTime,
      )

      expect(output).toEqual(sessionCapacity)
    })

    it('should return null if session capacity not available (404 from API)', async () => {
      fakeOrchestrationApi
        .get('/visit-sessions/capacity')
        .query({ prisonId, sessionDate, sessionStartTime, sessionEndTime })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(404)

      const output = await orchestrationApiClient.getVisitSessionCapacity(
        prisonId,
        sessionDate,
        sessionStartTime,
        sessionEndTime,
      )

      expect(output).toBeNull()
    })

    // API returns 500 IllegalStateException if multiple capacities found for specified date & times
    it('should return null if error retrieving session capacity (500 from API)', async () => {
      fakeOrchestrationApi
        .persist() // required because 500 causes server/data/restClient.ts to retry but the mock has been consumed
        .get('/visit-sessions/capacity')
        .query({ prisonId, sessionDate, sessionStartTime, sessionEndTime })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(500)

      const output = await orchestrationApiClient.getVisitSessionCapacity(
        prisonId,
        sessionDate,
        sessionStartTime,
        sessionEndTime,
      )

      expect(output).toBeNull()
    })
  })

  describe('getPrisonerProfile', () => {
    it('should return prisoner profile page for selected prisoner', async () => {
      const prisonerProfile = TestData.prisonerProfile()

      fakeOrchestrationApi
        .get(`/prisoner/${prisonId}/${prisonerProfile.prisonerId}/profile`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, prisonerProfile)

      const output = await orchestrationApiClient.getPrisonerProfile(prisonId, prisonerProfile.prisonerId)

      expect(output).toEqual(prisonerProfile)
    })
  })

  describe('getSupportedPrisonIds', () => {
    it('should return an array of supported prison IDs', async () => {
      const results = ['HEI', 'BLI']

      fakeOrchestrationApi
        .get('/config/prisons/supported')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await orchestrationApiClient.getSupportedPrisonIds()

      expect(output).toEqual(results)
    })
  })

  describe('getPrison', () => {
    it('should return a PrisonDTO object', async () => {
      const results = TestData.prisonDto()
      const prisonCode = 'BLI'

      fakeOrchestrationApi
        .get(`/config/prisons/prison/${prisonCode}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await orchestrationApiClient.getPrison(prisonCode)

      expect(output).toEqual(results)
    })
  })
})
