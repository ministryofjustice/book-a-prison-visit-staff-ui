import nock from 'nock'
import config from '../config'
import TestData from '../routes/testutils/testData'
import OrchestrationApiClient from './orchestrationApiClient'
import {
  ApplicationDto,
  ApproveVisitRequestBodyDto,
  BookingOrchestrationRequestDto,
  CancelVisitOrchestrationDto,
  ChangeApplicationDto,
  CreateApplicationDto,
  EventAuditRaw,
  ExcludeDateDto,
  IgnoreVisitNotificationsDto,
  PageVisitDto,
  PrisonDto,
  RegisterVisitorForBookerPrisonerDto,
  RejectVisitRequestBodyDto,
  SearchBookerDto,
  SessionSchedule,
  Visit,
  VisitBookingDetails,
  VisitBookingDetailsRaw,
  VisitNotificationEvent,
  VisitNotificationEventRaw,
  VisitRequestsCountDto,
  VisitRestriction,
} from './orchestrationApiTypes'
import { Prison, VisitSessionData } from '../@types/bapv'
import { setFeature } from './testutils/mockFeature'

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
    it('should return a BOOKED visit, given an application reference', async () => {
      const applicationReference = 'aaa-bbb-ccc'
      const bookingOrchestrationRequestDto: BookingOrchestrationRequestDto = {
        actionedBy: 'user1',
        applicationMethodType: 'NOT_KNOWN',
        allowOverBooking: false,
        userType: 'STAFF',
        visitorDetails: [{ visitorId: 1, visitorAge: 18 }],
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

      const output = await orchestrationApiClient.bookVisit({
        applicationReference,
        applicationMethod: bookingOrchestrationRequestDto.applicationMethodType,
        allowOverBooking: false,
        visitorDetails: [{ visitorId: 1, visitorAge: 18 }],
        username: 'user1',
      })

      expect(output).toStrictEqual(result)
    })
  })

  describe('updateVisit', () => {
    it('should return a BOOKED visit, given an application reference', async () => {
      const applicationReference = 'aaa-bbb-ccc'
      const bookingOrchestrationRequestDto: BookingOrchestrationRequestDto = {
        actionedBy: 'user1',
        applicationMethodType: 'NOT_KNOWN',
        allowOverBooking: false,
        userType: 'STAFF',
        visitorDetails: [{ visitorId: 1, visitorAge: 18 }],
      }

      const result: Partial<Visit> = {
        applicationReference,
        reference: 'ab-cd-ef-gh',
        visitStatus: 'BOOKED',
      }

      fakeOrchestrationApi
        .put(`/visits/${applicationReference}/update`, bookingOrchestrationRequestDto)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await orchestrationApiClient.updateVisit({
        applicationReference,
        applicationMethod: bookingOrchestrationRequestDto.applicationMethodType,
        allowOverBooking: false,
        visitorDetails: [{ visitorId: 1, visitorAge: 18 }],
        username: 'user1',
      })

      expect(output).toStrictEqual(result)
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
        actionedBy: 'user1',
        userType: 'STAFF',
      }

      const result: Visit = TestData.visit()

      fakeOrchestrationApi
        .put(`/visits/ab-cd-ef-gh/cancel`, cancelVisitDto)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await orchestrationApiClient.cancelVisit(reference, cancelVisitDto)

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

  describe('getVisitDetailed', () => {
    beforeEach(() => {
      // set enabled raw notification types: others should be filtered
      setFeature('notificationTypes', {
        enabledRawNotifications: [
          'PRISONER_RELEASED_EVENT',
          'PERSON_RESTRICTION_UPSERTED_EVENT',
          'VISITOR_RESTRICTION_UPSERTED_EVENT',
        ],
      })

      orchestrationApiClient = new OrchestrationApiClient(token)
    })

    it('should return visit details with events and notifications filtered and processed', async () => {
      const visitBookingDetailsRaw = TestData.visitBookingDetailsRaw({
        events: [
          // this unsupported audit event should be filtered
          { type: 'NON_ASSOCIATION_EVENT' },
          // this supported audit event should pass through
          { type: 'PRISONER_RELEASED_EVENT' },
          // these events should be converted to VISITOR_RESTRICTION
          { type: 'PERSON_RESTRICTION_UPSERTED_EVENT' },
          { type: 'VISITOR_RESTRICTION_UPSERTED_EVENT' },
        ] as EventAuditRaw[],

        notifications: [
          // this unsupported notification should be filtered
          { type: 'NON_ASSOCIATION_EVENT' },
          // this supported notification should pass through
          { type: 'PRISONER_RELEASED_EVENT' },
          // these notifications should be converted to VISITOR_RESTRICTION
          { type: 'PERSON_RESTRICTION_UPSERTED_EVENT' },
          { type: 'VISITOR_RESTRICTION_UPSERTED_EVENT' },
        ] as VisitBookingDetailsRaw['notifications'],
      })

      fakeOrchestrationApi
        .get(`/visits/${visitBookingDetailsRaw.reference}/detailed`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitBookingDetailsRaw)

      const result = await orchestrationApiClient.getVisitDetailed(visitBookingDetailsRaw.reference)

      expect(result.events).toStrictEqual([
        { type: 'PRISONER_RELEASED_EVENT' },
        { type: 'VISITOR_RESTRICTION' },
        { type: 'VISITOR_RESTRICTION' },
      ] as VisitBookingDetails['events'])

      expect(result.notifications).toStrictEqual([
        { type: 'PRISONER_RELEASED_EVENT' },
        { type: 'VISITOR_RESTRICTION' },
        { type: 'VISITOR_RESTRICTION' },
      ] as VisitBookingDetails['notifications'])
    })
  })

  describe('getVisitsBySessionTemplate', () => {
    it('should return visit previews details for given session template reference, date, and prison', async () => {
      const sessionTemplateReference = 'v9d.7ed.7u'
      const sessionDate = '2024-01-31'
      const visitRestrictions: VisitRestriction[] = ['OPEN', 'CLOSED']
      const visitPreviews = [TestData.visitPreview()]

      fakeOrchestrationApi
        .get('/visits/session-template')
        .query({
          prisonCode: prisonId,
          sessionTemplateReference,
          sessionDate,
          visitStatus: 'BOOKED',
          visitRestrictions: visitRestrictions.join(','),
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitPreviews)

      const output = await orchestrationApiClient.getVisitsBySessionTemplate(
        prisonId,
        sessionTemplateReference,
        sessionDate,
        visitRestrictions,
      )

      expect(output).toStrictEqual(visitPreviews)
    })

    it('should return visit previews details when only prison and date given (for migrated visits with no session template)', async () => {
      const sessionDate = '2024-01-31'
      const visitPreviews = [TestData.visitPreview()]

      fakeOrchestrationApi
        .get('/visits/session-template')
        .query({
          prisonCode: prisonId,
          sessionDate,
          visitStatus: 'BOOKED',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitPreviews)

      const output = await orchestrationApiClient.getVisitsBySessionTemplate(
        prisonId,
        undefined,
        sessionDate,
        undefined,
      )

      expect(output).toStrictEqual(visitPreviews)
    })
  })

  describe('getBookedVisitCountByDate', () => {
    it('should return booked visit count for given prison and date', async () => {
      const results: PageVisitDto = {
        totalElements: 2,
      }

      fakeOrchestrationApi
        .get(`/visits/search`)
        .query({
          prisonId: 'HEI',
          visitStartDate: '2022-05-23',
          visitEndDate: '2022-05-23',
          visitStatus: 'BOOKED',
          page: '0',
          size: '1',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await orchestrationApiClient.getBookedVisitCountByDate('HEI', '2022-05-23')

      expect(output).toBe(2)
    })
  })

  describe('changeVisitApplication', () => {
    it('should return a changed visit application given visit session data', async () => {
      const visitSessionData = <VisitSessionData>{
        selectedVisitSession: {
          date: '2022-02-14',
          sessionTemplateReference: 'v9d.7ed.7u',
          startTime: '',
          endTime: '',
        },
        visitRestriction: 'OPEN',
        visitors: [{ personId: 123 }],
        visitorSupport: { description: '' },
        mainContact: {
          phoneNumber: '01234 567890',
          email: 'visitor@example.com',
          contactName: 'John Smith',
        },
      }

      const result: Partial<ApplicationDto> = {
        reference: 'aaa-bbb-ccc',
      }

      fakeOrchestrationApi
        .put(`/visits/application/${visitSessionData.applicationReference}/slot/change`, <ChangeApplicationDto>{
          applicationRestriction: visitSessionData.visitRestriction,
          sessionTemplateReference: visitSessionData.selectedVisitSession.sessionTemplateReference,
          sessionDate: '2022-02-14',
          visitContact: {
            name: visitSessionData.mainContact.contactName,
            telephone: visitSessionData.mainContact.phoneNumber,
            email: visitSessionData.mainContact.email,
          },
          visitors: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
              visitContact: false,
            }
          }),
          visitorSupport: visitSessionData.visitorSupport,
          allowOverBooking: true,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await orchestrationApiClient.changeVisitApplication(visitSessionData)

      expect(output).toStrictEqual(result)
    })
  })

  describe('createVisitApplicationFromVisit', () => {
    it('should return a new Visit Application from a BOOKED visit', async () => {
      const visitSessionData = <VisitSessionData>{
        prisoner: {
          offenderNo: 'A1234BC',
        },
        selectedVisitSession: {
          date: '2022-02-14',
          sessionTemplateReference: 'v9d.7ed.7u',
          startTime: '',
          endTime: '',
        },
        visitRestriction: 'OPEN',
        visitors: [{ personId: 123 }],
        visitorSupport: { description: '' },
        mainContact: {
          phoneNumber: '01234 567890',
          email: 'visitor@example.com',
          contactName: 'John Smith',
        },
        visitReference: 'ab-cd-ef-gh',
      }

      const result: Partial<ApplicationDto> = {
        reference: 'aaa-bbb-ccc',
      }

      fakeOrchestrationApi
        .put(`/visits/application/${visitSessionData.visitReference}/change`, <CreateApplicationDto>{
          prisonerId: visitSessionData.prisoner.offenderNo,
          sessionTemplateReference: visitSessionData.selectedVisitSession.sessionTemplateReference,
          sessionDate: '2022-02-14',
          applicationRestriction: visitSessionData.visitRestriction,
          visitContact: {
            name: visitSessionData.mainContact.contactName,
            telephone: visitSessionData.mainContact.phoneNumber,
            email: visitSessionData.mainContact.email,
          },
          visitors: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
              visitContact: false,
            }
          }),
          visitorSupport: visitSessionData.visitorSupport,
          userType: 'STAFF',
          actionedBy: 'user1',
          allowOverBooking: true,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await orchestrationApiClient.createVisitApplicationFromVisit(visitSessionData, 'user1')

      expect(output).toStrictEqual(result)
    })
  })

  describe('createVisitApplication', () => {
    it('should return a new Visit Application', async () => {
      const visitSessionData = <VisitSessionData>{
        prisoner: {
          offenderNo: 'A1234BC',
        },
        selectedVisitSession: {
          date: '2022-02-14',
          sessionTemplateReference: 'v9d.7ed.7u',
          startTime: '',
          endTime: '',
        },
        visitRestriction: 'OPEN',
        visitors: [{ personId: 123 }],
        visitorSupport: { description: '' },
        mainContact: {
          phoneNumber: '01234 567890',
          contactName: 'John Smith',
        },
      }

      const result: Partial<ApplicationDto> = {
        reference: 'aaa-bbb-ccc',
      }

      fakeOrchestrationApi
        .post('/visits/application/slot/reserve', <CreateApplicationDto>{
          prisonerId: visitSessionData.prisoner.offenderNo,
          sessionTemplateReference: visitSessionData.selectedVisitSession.sessionTemplateReference,
          sessionDate: '2022-02-14',
          applicationRestriction: visitSessionData.visitRestriction,
          visitors: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
            }
          }),
          userType: 'STAFF',
          actionedBy: 'user1',
          allowOverBooking: true,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(201, result)

      const output = await orchestrationApiClient.createVisitApplication(visitSessionData, 'user1')

      expect(output).toStrictEqual(result)
    })
  })

  describe('getBookersByEmail', () => {
    const email = 'booker@example.com'

    it('should return booker(s) for given email address', async () => {
      const bookers = [TestData.bookerSearchResult()]

      fakeOrchestrationApi
        .post('/public/booker/search', <SearchBookerDto>{ email })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(201, bookers)

      const output = await orchestrationApiClient.getBookersByEmail(email)

      expect(output).toStrictEqual(bookers)
    })

    it('should return empty array if no booker for given email address (API 404)', async () => {
      fakeOrchestrationApi
        .post('/public/booker/search', <SearchBookerDto>{ email })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(404)

      const output = await orchestrationApiClient.getBookersByEmail(email)

      expect(output).toStrictEqual([])
    })

    it('should throw any other (non-404) API errors', async () => {
      fakeOrchestrationApi
        .post('/public/booker/search', <SearchBookerDto>{ email })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(500)

      await expect(orchestrationApiClient.getBookersByEmail(email)).rejects.toThrow('Internal Server Error')
    })
  })

  describe('getBookerDetails', () => {
    it('should return booker details for given booker reference', async () => {
      const booker = TestData.bookerDetailedInfo()
      const { reference } = booker

      fakeOrchestrationApi
        .get(`/public/booker/${reference}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, booker)

      const output = await orchestrationApiClient.getBookerDetails(reference)

      expect(output).toStrictEqual(booker)
    })
  })

  describe('getNonLinkedSocialContacts', () => {
    it('should return all non-linked social contacts for given prisoner number and booker reference', async () => {
      const { reference, permittedPrisoners } = TestData.bookerDetailedInfo()
      const socialContacts = [TestData.socialContact()]

      const prisonerId = permittedPrisoners[0].prisoner.prisonId

      fakeOrchestrationApi
        .get(`/public/booker/${reference}/prisoners/${prisonerId}/social-contacts`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, socialContacts)

      const output = await orchestrationApiClient.getNonLinkedSocialContacts({ reference, prisonerId })

      expect(output).toStrictEqual(socialContacts)
    })
  })

  describe('linkBookerVisitor', () => {
    it('should link a visitor to a booker account for given prisoner', async () => {
      const reference = 'aaa-bbb-ccc'
      const prisonerId = 'A1234BC'
      const visitorId = 123
      const sendNotification = true

      fakeOrchestrationApi
        .post(`/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors`, <
          RegisterVisitorForBookerPrisonerDto
        >{ visitorId, active: true, sendNotificationFlag: sendNotification })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200)

      await orchestrationApiClient.linkBookerVisitor({ reference, prisonerId, visitorId, sendNotification })

      expect(fakeOrchestrationApi.isDone()).toBe(true)
    })
  })

  describe('unlinkBookerVisitor', () => {
    const reference = 'aaa-bbb-ccc'
    const prisonerId = 'A1234BC'
    const visitorId = 123

    it('should unlink a visitor from a booker account', async () => {
      fakeOrchestrationApi
        .delete(`/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors/${visitorId}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200)

      await orchestrationApiClient.unlinkBookerVisitor({ reference, prisonerId, visitorId })

      expect(fakeOrchestrationApi.isDone()).toBe(true)
    })

    it('should catch 404 API error and handle as success', async () => {
      fakeOrchestrationApi
        .delete(`/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors/${visitorId}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(404)

      await orchestrationApiClient.unlinkBookerVisitor({ reference, prisonerId, visitorId })

      expect(fakeOrchestrationApi.isDone()).toBe(true)
    })

    it('should throw other API errors', async () => {
      fakeOrchestrationApi
        .delete(`/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors/${visitorId}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(400)

      await expect(orchestrationApiClient.unlinkBookerVisitor({ reference, prisonerId, visitorId })).rejects.toThrow(
        'Bad Request',
      )
    })
  })

  describe('ignoreNotifications', () => {
    it('should ignore visit notification with the specified reason and return visit', async () => {
      const reference = 'ab-cd-ef-gh'

      const ignoreVisitNotificationsDto: IgnoreVisitNotificationsDto = {
        reason: 'adjustments will be made to seating',
        actionedBy: 'user1',
      }

      const visit = { reference } as Visit

      fakeOrchestrationApi
        .put(`/visits/notification/visit/${reference}/ignore`, ignoreVisitNotificationsDto)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visit)

      const result = await orchestrationApiClient.ignoreNotifications(reference, ignoreVisitNotificationsDto)

      expect(result).toStrictEqual(visit)
    })
  })

  describe('getNotificationCount', () => {
    it('should return notification count for given prison for enabled notification types', async () => {
      const notificationCount = TestData.notificationCount()
      const { enabledRawNotifications } = config.features.notificationTypes

      fakeOrchestrationApi
        .get(`/visits/notification/${prisonId}/count`)
        .query(new URLSearchParams({ types: enabledRawNotifications }))
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, notificationCount)

      const output = await orchestrationApiClient.getNotificationCount(prisonId)

      expect(output).toEqual(notificationCount)
    })
  })

  describe('getVisitNotifications', () => {
    it('should return future visits with standardised notifications for given prison and enabled types', async () => {
      const { enabledRawNotifications } = config.features.notificationTypes

      const visitNotificationsRaw = [
        TestData.visitNotificationsRaw({
          notifications: [
            { type: 'PRISONER_RELEASED_EVENT' },
            // these notifications should be converted to VISITOR_RESTRICTION
            { type: 'PERSON_RESTRICTION_UPSERTED_EVENT' },
            { type: 'VISITOR_RESTRICTION_UPSERTED_EVENT' },
          ] as VisitNotificationEventRaw[],
        }),
      ]

      const expectedVisitNotifications = [
        TestData.visitNotifications({
          notifications: [
            { type: 'PRISONER_RELEASED_EVENT' },
            // these notifications should be converted to VISITOR_RESTRICTION
            { type: 'VISITOR_RESTRICTION' },
            { type: 'VISITOR_RESTRICTION' },
          ] as VisitNotificationEvent[],
        }),
      ]

      fakeOrchestrationApi
        .get(`/visits/notification/${prisonId}/visits`)
        .query(new URLSearchParams({ types: enabledRawNotifications }))
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitNotificationsRaw)

      const result = await orchestrationApiClient.getVisitNotifications(prisonId)

      expect(result).toStrictEqual(expectedVisitNotifications)
    })
  })

  describe('unblockVisitDate', () => {
    it('should unblock a visit date for given prison and send username', async () => {
      const date = '2024-09-06'
      const user = 'user'

      fakeOrchestrationApi
        .put(`/config/prisons/prison/${prisonId}/exclude-date/remove`, <ExcludeDateDto>{
          excludeDate: date,
          actionedBy: user,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200)

      await orchestrationApiClient.unblockVisitDate(prisonId, date, user)

      expect(fakeOrchestrationApi.isDone()).toBe(true)
    })
  })

  describe('blockVisitDate', () => {
    it('should block a visit date for given prison and send username', async () => {
      const date = '2024-09-06'
      const user = 'user'

      fakeOrchestrationApi
        .put(`/config/prisons/prison/${prisonId}/exclude-date/add`, <ExcludeDateDto>{
          excludeDate: date,
          actionedBy: user,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200)

      await orchestrationApiClient.blockVisitDate(prisonId, date, user)

      expect(fakeOrchestrationApi.isDone()).toBe(true)
    })
  })

  describe('getFutureBlockedDates', () => {
    it('should return future blocked dates for given prison', async () => {
      const results = [TestData.excludeDateDto()]

      fakeOrchestrationApi
        .get(`/config/prisons/prison/${prisonId}/exclude-date/future`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await orchestrationApiClient.getFutureBlockedDates(prisonId)

      expect(output).toStrictEqual(results)
    })
  })

  describe('isBlockedDate', () => {
    it('should return boolean indicating whether given date is a blocked', async () => {
      const results = { isExcluded: true }
      const excludedDate = '2024-12-12'

      fakeOrchestrationApi
        .get(`/config/prisons/prison/${prisonId}/exclude-date/${excludedDate}/isExcluded`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await orchestrationApiClient.isBlockedDate(prisonId, excludedDate)

      expect(output).toStrictEqual(true)
    })
  })

  describe('rejectVisitRequest', () => {
    it('should reject a visit request', async () => {
      const reference = 'ab-cd-ef-gh'
      const visitRequestResponse = TestData.visitRequestResponse()

      fakeOrchestrationApi
        .put(`/visits/requests/${reference}/reject`, <RejectVisitRequestBodyDto>{
          visitReference: reference,
          actionedBy: 'user1',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitRequestResponse)

      expect(await orchestrationApiClient.rejectVisitRequest({ reference, username: 'user1' })).toStrictEqual(
        visitRequestResponse,
      )
    })
  })

  describe('approveVisitRequest', () => {
    it('should approve a visit request', async () => {
      const reference = 'ab-cd-ef-gh'
      const visitRequestResponse = TestData.visitRequestResponse()

      fakeOrchestrationApi
        .put(`/visits/requests/${reference}/approve`, <ApproveVisitRequestBodyDto>{
          visitReference: reference,
          actionedBy: 'user1',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitRequestResponse)

      expect(await orchestrationApiClient.approveVisitRequest({ reference, username: 'user1' })).toStrictEqual(
        visitRequestResponse,
      )
    })
  })

  describe('getVisitRequests', () => {
    it('should get visit request summaries for given prison', async () => {
      const visitRequests = [TestData.visitRequestSummary()]

      fakeOrchestrationApi
        .get(`/visits/requests/${prisonId}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitRequests)

      const output = await orchestrationApiClient.getVisitRequests(prisonId)

      expect(output).toStrictEqual(visitRequests)
    })
  })

  describe('getVisitRequestCount', () => {
    it('should count of visit requests for given prison', async () => {
      const count: VisitRequestsCountDto = { count: 1 }

      fakeOrchestrationApi
        .get(`/visits/requests/${prisonId}/count`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, count)

      const output = await orchestrationApiClient.getVisitRequestCount(prisonId)

      expect(output).toStrictEqual(count)
    })
  })

  describe('getSingleVisitSession', () => {
    it('should return a single Visit Session', async () => {
      const results = TestData.visitSession()

      const sessionDate = results.startTimestamp.split('T')[0]
      fakeOrchestrationApi
        .get('/visit-sessions/session')
        .query({
          prisonCode: results.prisonId,
          sessionDate,
          sessionTemplateReference: results.sessionTemplateReference,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await orchestrationApiClient.getSingleVisitSession(
        results.prisonId,
        sessionDate,
        results.sessionTemplateReference,
      )

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

  describe('getVisitSessionsAndSchedule', () => {
    it('should return array of visit sessions and events for specified prisoner', async () => {
      const visitSessionsAndScheduleDto = TestData.visitSessionsAndSchedule()
      const prisonerId = 'A1234BC'
      const minNumberOfDays = 2
      const username = 'user1'

      fakeOrchestrationApi
        .get('/visit-sessions-and-schedule')
        .query({ prisonId, prisonerId, min: minNumberOfDays, username })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitSessionsAndScheduleDto)

      const output = await orchestrationApiClient.getVisitSessionsAndSchedule({
        prisonId,
        prisonerId,
        minNumberOfDays,
        username,
      })

      expect(output).toStrictEqual(visitSessionsAndScheduleDto)
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

      expect(output).toStrictEqual(prisonerProfile)
    })
  })

  describe('getSupportedPrisonIds', () => {
    it('should return an array of supported prison IDs', async () => {
      const results = ['HEI', 'BLI']

      fakeOrchestrationApi
        .get('/config/prisons/user-type/STAFF/supported')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await orchestrationApiClient.getSupportedPrisonIds()

      expect(output).toEqual(results)
    })
  })

  describe('getPrison', () => {
    it('should return a Prison object (mapped from received PrisonDto)', async () => {
      const receivedPrisonDto = { code: 'HEI', prisonName: 'Hewell (HMP)' } as PrisonDto
      const expectedPrison = { prisonId: 'HEI', prisonName: 'Hewell (HMP)' } as Prison

      fakeOrchestrationApi
        .get(`/config/prisons/prison/${prisonId}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, receivedPrisonDto)

      const output = await orchestrationApiClient.getPrison(prisonId)

      expect(output).toStrictEqual(expectedPrison)
    })
  })
})
