import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  getPrisoners: (): SuperAgentRequest => {
    const results = {
      totalPages: 1,
      totalElements: 2,
      content: [
        {
          lastName: 'test',
          firstName: 'test',
          prisonerNumber: 'test',
          dateOfBirth: '2000-01-01',
        },
        {
          lastName: 'test2',
          firstName: 'test2',
          prisonerNumber: 'test2',
          dateOfBirth: '2000-01-02',
        },
      ],
    }

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
  getPrisoner: (): SuperAgentRequest => {
    const results = {
      totalPages: 1,
      totalElements: 1,
      content: [
        {
          lastName: 'test',
          firstName: 'test',
          prisonerNumber: 'test',
          dateOfBirth: '2000-01-01',
        },
      ],
    }

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
