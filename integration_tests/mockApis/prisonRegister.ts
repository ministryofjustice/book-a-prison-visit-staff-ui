import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import TestData from '../../server/routes/testutils/testData'
import { PrisonName } from '../../server/data/prisonRegisterApiTypes'

export default {
  stubPrisonNames: (prisons: PrisonName[] = TestData.prisonNames()): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/prisonRegister/prisons/names',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisons,
      },
    })
  },
}
