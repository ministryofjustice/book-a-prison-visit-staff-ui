import nock from 'nock'
import config from '../config'
import FrontendComponentsClient from './frontendComponentsClient'

describe('FrontendComponentsClient', () => {
  const frontendComponentsClient = new FrontendComponentsClient('not used')
  let fakeFrontendComponentsApi: nock.Scope

  beforeEach(() => {
    fakeFrontendComponentsApi = nock(config.apis.frontendComponents.url)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getComponents', () => {
    it('should get frontend components', async () => {
      const userToken = 'user1'
      const response = { some: 'response' }

      fakeFrontendComponentsApi
        .get('/components?component=header&component=footer')
        .matchHeader('x-user-token', userToken)
        .reply(200, response)

      const result = await frontendComponentsClient.getComponents(['header', 'footer'], userToken)
      expect(result).toStrictEqual(response)
    })
  })
})
