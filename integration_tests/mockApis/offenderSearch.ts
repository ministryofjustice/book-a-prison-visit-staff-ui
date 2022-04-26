import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'

export default {
  getPrisoners: (results: {
    totalPages: number
    totalElements: number
    content: Partial<Prisoner>[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        url: '/offenderSearch/keyword',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
  getPrisoner: (results: {
    totalPages: number
    totalElements: number
    content: Partial<Prisoner>[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/offenderSearch/keyword',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
}
