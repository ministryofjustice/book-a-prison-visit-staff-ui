import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'

export default {
  stubPrisoners: ({
    results = {
      totalPages: 0,
      totalElements: 0,
      content: [],
    },
    prisonId = 'HEI',
    term = '',
    page = '0',
    size = '10',
  }: {
    results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] }
    prisonId: string
    term: string
    page: string
    size: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/offenderSearch/prison/${prisonId}/prisoners?term=${term}&page=${page}&size=${size}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
  // stubPrisoner: (results: {
  //   totalPages: number
  //   totalElements: number
  //   content: Partial<Prisoner>[]
  // }): SuperAgentRequest => {
  //   return stubFor({
  //     request: {
  //       method: 'GET',
  //       url: '/offenderSearch/prison/HEI/prisoners?term=A1234BC&page=0&size=10',
  //     },
  //     response: {
  //       status: 200,
  //       headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  //       jsonBody: results,
  //     },
  //   })
  // },
  stubPrisonerById: (prisoner: Prisoner): SuperAgentRequest => {
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
