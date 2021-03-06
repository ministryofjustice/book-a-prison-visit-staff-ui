import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { Visit } from '../../server/data/visitSchedulerApiTypes'

export default {
  stubGetAvailableSupportOptions: (): SuperAgentRequest => {
    const results = [
      {
        type: 'MASK_EXEMPT',
        description: 'Face mask exempt',
      },
      {
        type: 'UNKNOWN',
        description: 'Misc',
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
    const results = {
      reference,
      prisonerId: 'A1234BC',
      prisonId: 'HEI',
      visitRoom: 'A1 L3',
      visitType: 'SOCIAL',
      visitStatus: 'RESERVED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-04-25T09:35:34.489Z',
      endTimestamp: '',
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
    }

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/visitScheduler/visits/${reference}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
  getUpcomingVisits: ({
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
  getPastVisits: ({ offenderNo, pastVisits }: { offenderNo: string; pastVisits: Visit[] }): SuperAgentRequest => {
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
    const results = [
      {
        sessionTemplateId: 1,
        visitRoomName: 'A1',
        visitType: 'SOCIAL',
        prisonId: 'HEI',
        restrictions: 'restrictions test',
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
  stubCreateVisit: (): SuperAgentRequest => {
    const results = {
      reference: 'ab-cd-ef-gh',
      prisonerId: 'AF34567G',
      prisonId: 'HEI',
      visitRoom: 'A1 L3',
      visitType: 'SOCIAL',
      visitStatus: 'RESERVED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-02-14T10:00:00',
      endTimestamp: '2022-02-14T11:00:00',
      visitContact: {
        name: 'John Smith',
        telephone: '01234 567890',
      },
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
    }

    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/visitScheduler/visits',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
  stubUpdateVisit: (): SuperAgentRequest => {
    const results = {
      reference: 'ab-cd-ef-gh',
      prisonerId: 'AF34567G',
      prisonId: 'HEI',
      visitRoom: 'A1 L3',
      visitType: 'SOCIAL',
      visitStatus: 'BOOKED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-02-14T10:00:00',
      endTimestamp: '2022-02-14T11:00:00',
      visitContact: {
        name: 'John Smith',
        telephone: '01234 567890',
      },
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
    }

    return stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/visitScheduler/visits',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
}
