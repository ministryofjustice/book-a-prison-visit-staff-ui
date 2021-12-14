import nock from 'nock'
import config from '../config'
import PrisonerSearchClient from './prisonerSearchClient'
import RestClient from './restClient'

describe.skip('prisonSearchClientBuilder', () => {
  let fakePrisonerSearchApi: nock.Scope
  let client: PrisonerSearchClient

  const token = 'token-1'

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearch.url)
    const restClient = new RestClient('Prisoner Search REST Client', config.apis.prisonerSearch, token)
    client = new PrisonerSearchClient(restClient)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPrisoners', () => {
    it('should return data from api', async () => {
      const results = {
        matches: [
          {
            prisoner: {
              lastName: 'test',
              firstName: 'test',
              prisonerNumber: 'test',
              dateOfBirth: '2000-01-01',
            },
          },
        ],
      }
      fakePrisonerSearchApi
        .post(
          `/match-prisoners`,
          '{"firstName":"test","lastName":"test","prisonerIdentifier":"test","prisonIds":["HEI"]}'
        )
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getPrisoners('test')

      expect(output).toEqual(results)
    })
  })
})
