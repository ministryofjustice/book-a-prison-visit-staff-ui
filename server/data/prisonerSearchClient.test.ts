import nock from 'nock'
import config from '../config'
import PrisonerSearchClient from './prisonerSearchClient'
import RestClient from './restClient'

describe('prisonSearchClientBuilder', () => {
  let fakePrisonerSearchApi: nock.Scope
  let client: PrisonerSearchClient

  const token = 'token-1'

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearch.url)
    const restClient = new RestClient('Prisoner Search REST Client', config.apis.prisonerSearch, token)
    client = new PrisonerSearchClient(restClient)
  })

  afterEach(() => {
    console.log(nock.pendingMocks())
    nock.cleanAll()
  })

  describe('getPrisoners', () => {
    it('should return data from api', async () => {
      const results = {
        totalPage: 1,
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
      fakePrisonerSearchApi
        .post(
          '/keyword',
          `{"orWords":"test","fuzzyMatch":true,"prisonIds":["HEI"],"pagination":{"page":0,"size":${config.apis.prisonerSearch.pageSize}}}`
        )
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getPrisoners('test')

      expect(output).toEqual(results)
    })
  })

  describe('getPrisoner', () => {
    it('should return data from api', async () => {
      const results = {
        totalPage: 1,
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
      fakePrisonerSearchApi
        .post('/keyword', `{"andWords":"test","prisonIds":["HEI"]}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getPrisoner('test')

      expect(output).toEqual(results)
    })
  })

  describe('getPrisonersByNumbers', () => {
    it('should return data from api', async () => {
      const prisonerNumbers = ['A1234BC', 'B1234CD']
      const results = [
        {
          lastName: 'test',
          firstName: 'test',
          prisonerNumber: 'test',
          dateOfBirth: '2000-01-01',
        },
      ]
      fakePrisonerSearchApi
        .post('/prisoner-search/prisoner-numbers', `{"prisonerNumbers":${JSON.stringify(prisonerNumbers)}}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getPrisonersByNumbers(prisonerNumbers)

      expect(output).toEqual(results)
    })
  })
})
