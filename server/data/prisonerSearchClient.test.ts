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

  describe('getPrisonersByPrisonerNumbers', () => {
    it('should return data from api', async () => {
      const prisonerNumbers = ['A1234BC', 'B1234CD']
      const results = [
        {
          lastName: 'lastName1',
          firstName: 'firstName1',
          prisonerNumber: 'A1234BC',
          dateOfBirth: '2000-01-01',
        },
        {
          lastName: 'lastName2',
          firstName: 'firstName2',
          prisonerNumber: 'B1234CD',
          dateOfBirth: '2000-01-02',
        },
      ]
      fakePrisonerSearchApi
        .post('/prisoner-search/prisoner-numbers', `{"prisonerNumbers":${JSON.stringify(prisonerNumbers)}}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getPrisonersByPrisonerNumbers(prisonerNumbers)

      expect(output).toEqual(results)
    })
  })
})
