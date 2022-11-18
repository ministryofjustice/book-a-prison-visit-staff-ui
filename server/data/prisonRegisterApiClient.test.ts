import nock from 'nock'
import config from '../config'
import PrisonRegisterApiClient, { prisonRegisterApiClientBuilder } from './prisonRegisterApiClient'
import { createPrisons } from './__testutils/testObjects'

describe('prisonRegisterApiClient', () => {
  let fakePrisonRegisterApi: nock.Scope
  let client: PrisonRegisterApiClient
  const token = 'token-1'
  const allPrisons = createPrisons()

  beforeEach(() => {
    fakePrisonRegisterApi = nock(config.apis.prisonRegister.url)
    client = prisonRegisterApiClientBuilder(token)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPrisons', () => {
    it('should return all prisons from the Prison Register', async () => {
      fakePrisonRegisterApi.get('/prisons').matchHeader('authorization', `Bearer ${token}`).reply(200, allPrisons)
      const output = await client.getPrisons()
      expect(output).toEqual(allPrisons)
    })
  })
})
