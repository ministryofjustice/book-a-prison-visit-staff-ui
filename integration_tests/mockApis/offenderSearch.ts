import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'

export default {
  getPrisoners: (
    results: {
      totalPages: number
      totalElements: number
      content: Partial<Prisoner>[]
    },
    page = '0',
    size = '10',
  ): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/offenderSearch/prison/HEI/prisoners?term=A1234BC&page=${page}&size=${size}`,
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
        method: 'GET',
        url: '/offenderSearch/prison/HEI/prisoners?term=A1234BC&page=0&size=10',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
}
