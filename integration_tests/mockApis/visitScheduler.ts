import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { Visit, VisitSession } from '../../server/data/visitSchedulerApiTypes'
import TestData from '../../server/routes/testutils/testData'

export default {
  stubAvailableSupport: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/visitScheduler/visit-support',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: TestData.supportTypes(),
      },
    })
  },
  stubBookVisit: (visit: Visit): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/visitScheduler/visits/${visit.applicationReference}/book`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visit,
      },
    })
  },
  stubChangeReservedSlot: (visit: Visit): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/visitScheduler/visits/${visit.applicationReference}/slot/change`,
        bodyPatterns: [
          {
            equalToJson: {
              visitRestriction: visit.visitRestriction,
              startTimestamp: visit.startTimestamp,
              endTimestamp: visit.endTimestamp,
              visitContact: visit.visitContact,
              visitors: visit.visitors,
              visitorSupport: visit.visitorSupport,
            },
            ignoreArrayOrder: true,
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visit,
      },
    })
  },
  stubSupportedPrisonIds: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/visitScheduler/config/prisons/supported',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: TestData.supportedPrisonIds(),
      },
    })
  },
  stubUpcomingVisits: ({
    offenderNo,
    upcomingVisits,
  }: {
    offenderNo: string
    upcomingVisits: Visit[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/visitScheduler/visits/search',
        queryParameters: {
          prisonerId: { equalTo: offenderNo },
          startDateTime: { matches: '.*' },
          visitStatus: { and: [{ contains: 'BOOKED' }, { contains: 'CANCELLED' }] },
          page: { equalTo: '0' },
          size: { equalTo: '1000' },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { content: upcomingVisits },
      },
    })
  },
  stubPastVisits: ({ offenderNo, pastVisits }: { offenderNo: string; pastVisits: Visit[] }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/visitScheduler/visits/search',
        queryParameters: {
          prisonerId: { equalTo: offenderNo },
          endDateTime: { matches: '.*' },
          visitStatus: { and: [{ contains: 'BOOKED' }, { contains: 'CANCELLED' }] },
          page: { equalTo: '0' },
          size: { equalTo: '1000' },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { content: pastVisits },
      },
    })
  },
  stubReserveVisit: (visit: Visit): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        url: '/visitScheduler/visits/slot/reserve',
        bodyPatterns: [
          {
            equalToJson: {
              prisonerId: visit.prisonerId,
              prisonId: visit.prisonId,
              visitRoom: visit.visitRoom,
              visitType: visit.visitType,
              visitRestriction: visit.visitRestriction,
              startTimestamp: visit.startTimestamp,
              endTimestamp: visit.endTimestamp,
              visitors: visit.visitors,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visit,
      },
    })
  },
  stubVisitSessions: ({
    prisonId,
    offenderNo,
    visitSessions,
  }: {
    prisonId: string
    offenderNo: string
    visitSessions: VisitSession[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/visitScheduler/visit-sessions?prisonId=${prisonId}&prisonerId=${offenderNo}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitSessions,
      },
    })
  },
  stubVisit: (reference: string): SuperAgentRequest => {
    const result: Visit = {
      applicationReference: 'aaa-bbb-ccc',
      reference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId: 'HEI',
      visitRoom: 'A1 L3',
      visitType: 'SOCIAL',
      visitStatus: 'RESERVED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-02-14T10:00:00',
      endTimestamp: '2022-02-14T11:00:00',
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
    }

    return stubFor({
      request: {
        method: 'GET',
        url: `/visitScheduler/visits/${reference}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: result,
      },
    })
  },
}
