import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'

export default {
  stubPrisoner: (prisoner: Prisoner, prisonId = 'HEI'): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/offenderSearch/prison/${prisonId}/prisoners?term=${prisoner.prisonerNumber}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { content: [prisoner] },
      },
    })
  },
  stubPrisoners: ({
    results = {
      totalPages: 0,
      totalElements: 0,
      content: [],
    },
    prisonId = 'HEI',
    term,
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

  stubPrisonerSearchPing: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/offenderSearch/health/ping',
      },
      response: {
        status: 200,
      },
    })
  },
}
