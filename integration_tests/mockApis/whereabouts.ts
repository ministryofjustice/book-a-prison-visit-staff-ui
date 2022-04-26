import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetOffenderEvents: ({
    offenderNo,
    fromDate,
    toDate,
  }: {
    offenderNo: string
    fromDate: string
    toDate: string
  }): SuperAgentRequest => {
    const results = {
      bookingId: 123456,
      eventClass: 'ABC',
      eventDate: '2022-04-25T09:35:34.489Z',
      eventSource: 'ABC',
      eventSourceDesc: 'Source Desc',
      eventStatus: 'ABC',
      eventSubType: 'ABCDEF',
      eventSubTypeDesc: 'ABCDEF Desc',
      eventType: 'ABC',
      eventTypeDesc: 'ABC Desc',
      startTime: '2022-04-25T09:35:34.489Z',
    }

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/whereabouts/events/${offenderNo}?fromDate=${fromDate}&toDate=${toDate}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
}
