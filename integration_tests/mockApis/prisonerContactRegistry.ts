import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { Contact } from '../../server/data/prisonerContactRegistryApiTypes'

export default {
  stubPrisonerSocialContacts: ({
    offenderNo,
    contacts,
  }: {
    offenderNo: string
    contacts: Contact[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/contactRegistry/prisoners/${offenderNo}/contacts?type=S`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: contacts,
      },
    })
  },
}
