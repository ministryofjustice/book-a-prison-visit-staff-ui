import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { Contact } from '../../server/data/prisonerContactRegistryApiTypes'

export default {
  stubPrisonerSocialContacts: ({
    offenderNo,
    contacts,
    approvedVisitorsOnly = 'true',
  }: {
    offenderNo: string
    contacts: Contact[]
    approvedVisitorsOnly: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/contactRegistry/prisoners/${offenderNo}/contacts/social?approvedVisitorsOnly=${approvedVisitorsOnly}&hasDateOfBirth=false&withAddress=false`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: contacts,
      },
    })
  },

  stubPrisonerContactRegistryPing: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/contactRegistry/health/ping',
      },
      response: {
        status: 200,
      },
    })
  },
}
