import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { SupportType, Visit, VisitSession } from '../../server/data/visitSchedulerApiTypes'

export default {
  stubGetAvailableSupportOptions: (): SuperAgentRequest => {
    const results: SupportType[] = [
      {
        type: 'WHEELCHAIR',
        description: 'Wheelchair ramp',
      },
      {
        type: 'OTHER',
        description: 'Other',
      },
    ]

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/visitScheduler/visit-support',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
  stubGetVisit: (reference: string): SuperAgentRequest => {
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
        urlPattern: `/visitScheduler/visits/${reference}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: result,
      },
    })
  },
  stubGetUpcomingVisits: ({
    offenderNo,
    upcomingVisits,
  }: {
    offenderNo: string
    upcomingVisits: Visit[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/visitScheduler/visits\\?prisonerId=${offenderNo}&prisonId=HEI&startTimestamp=.*`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: upcomingVisits,
      },
    })
  },
  stubGetPastVisits: ({ offenderNo, pastVisits }: { offenderNo: string; pastVisits: Visit[] }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/visitScheduler/visits\\?prisonerId=${offenderNo}&prisonId=HEI&endTimestamp=.*`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: pastVisits,
      },
    })
  },
  stubGetVisitSessions: (): SuperAgentRequest => {
    const results: VisitSession[] = [
      {
        sessionTemplateId: 1,
        visitRoomName: 'A1',
        visitType: 'SOCIAL',
        prisonId: 'HEI',
        openVisitCapacity: 15,
        openVisitBookedCount: 0,
        closedVisitCapacity: 10,
        closedVisitBookedCount: 0,
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
      },
    ]

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/visitScheduler/visit-sessions?prisonId=HEI',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
}
