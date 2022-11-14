import nock from 'nock'
import config from '../config'
import PrisonRegisterApiClient, { prisonRegisterApiClientBuilder } from './prisonRegisterApiClient'
import { Prison } from './prisonRegisterApiTypes'

describe('prisonRegisterApiClient', () => {
  let fakePrisonRegisterApi: nock.Scope
  let client: PrisonRegisterApiClient
  const token = 'token-1'

  beforeEach(() => {
    fakePrisonRegisterApi = nock(config.apis.prisonRegister.url)
    client = prisonRegisterApiClientBuilder(token)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPrisons', () => {
    it('should return all prisons from the Prison Register', async () => {
      const results = [
        {
          prisonId: 'HEI',
          prisonName: 'Hewell (HMP)',
        },
        {
          prisonId: 'BLI',
          prisonName: 'Bristol (HMP & YOI)',
        },
      ] as Prison[]

      fakePrisonRegisterApi.get('/prisons').matchHeader('authorization', `Bearer ${token}`).reply(200, results)

      const output = await client.getPrisons()

      expect(output).toEqual(results)
    })
  })
})
