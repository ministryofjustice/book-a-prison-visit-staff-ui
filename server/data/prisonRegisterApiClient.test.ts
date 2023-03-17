import nock from 'nock'
import config from '../config'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import TestData from '../routes/testutils/testData'

describe('prisonRegisterApiClient', () => {
  let fakePrisonRegisterApi: nock.Scope
  let prisonRegisterApiClient: PrisonRegisterApiClient
  const token = 'token-1'
  const allPrisons = TestData.prisons()

  beforeEach(() => {
    fakePrisonRegisterApi = nock(config.apis.prisonRegister.url)
    prisonRegisterApiClient = new PrisonRegisterApiClient(token)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getPrisons', () => {
    it('should return all prisons from the Prison Register', async () => {
      fakePrisonRegisterApi.get('/prisons').matchHeader('authorization', `Bearer ${token}`).reply(200, allPrisons)
      const output = await prisonRegisterApiClient.getPrisons()
      expect(output).toEqual(allPrisons)
    })
  })
})
