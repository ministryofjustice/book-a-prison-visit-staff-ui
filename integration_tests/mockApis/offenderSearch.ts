import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'

export default {
  stubGetPrisoners: (
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
  stubGetPrisoner: (results: {
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
  stubGetPrisonerById: (prisoner: Prisoner): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/offenderSearch/prisoner/${prisoner.prisonerNumber}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisoner,
      },
    })
  },
}
