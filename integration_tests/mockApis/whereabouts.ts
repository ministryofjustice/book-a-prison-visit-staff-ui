import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { ScheduledEvent } from '../../server/data/whereaboutsApiTypes'

export default {
  stubOffenderEvents: ({
    offenderNo,
    fromDate,
    toDate,
    scheduledEvents,
  }: {
    offenderNo: string
    fromDate: string
    toDate: string
    scheduledEvents: ScheduledEvent[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/whereabouts/events/${offenderNo}?fromDate=${fromDate}&toDate=${toDate}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: scheduledEvents,
      },
    })
  },
}
