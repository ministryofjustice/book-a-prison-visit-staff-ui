import nock from 'nock'
import config from '../config'
import PrisonerSearchClient from './prisonerSearchClient'
import TestData from '../routes/testutils/testData'

describe('prisonSearchClientBuilder', () => {
  let fakePrisonerSearchApi: nock.Scope
  let prisonerSearchClient: PrisonerSearchClient

  const prisonId = 'HEI'
  const token = 'token-1'

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearch.url)
    prisonerSearchClient = new PrisonerSearchClient(token)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
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
        .get('/prison/HEI/prisoners')
        .query({
          term: 'test',
          page: '0',
          size: config.apis.prisonerSearch.pageSize,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await prisonerSearchClient.getPrisoners('test', prisonId)

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
        .get('/prison/HEI/prisoners')
        .query({
          term: 'test',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await prisonerSearchClient.getPrisoner('test', prisonId)

      expect(output).toEqual(results)
    })
  })

  describe('getPrisonerById', () => {
    it('should return data for single prisoner by prisoner ID', async () => {
      const prisoner = TestData.prisoner()

      fakePrisonerSearchApi
        .get('/prisoner/A1234BC')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, prisoner)

      const output = await prisonerSearchClient.getPrisonerById('A1234BC')

      expect(output).toEqual(prisoner)
    })
  })

  describe('getPrisonersByPrisonerNumbers', () => {
    it('should return data from api with the a single page', async () => {
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

      const output = await prisonerSearchClient.getPrisonersByPrisonerNumbers(prisonerNumbers)

      expect(output).toEqual({
        totalPages: 1,
        totalElements: 2,
        content: results,
      })
    })

    it.skip('should return data from api with the multiple pages', async () => {
      const prisonerNumbers = []
      const results = []
      const numberOfResults = Math.ceil(config.apis.prisonerSearch.pageSize * 1.5)

      for (let index = 0; index < numberOfResults; index += 1) {
        const numericPart = index.toString().padStart(4, '0')
        prisonerNumbers.push(`A${numericPart}BC`)
        results.push({
          lastName: `lastName${numericPart}`,
          firstName: `firstName${numericPart}`,
          prisonerNumber: `A${numericPart}BC`,
          dateOfBirth: '2000-01-01',
        })
      }

      fakePrisonerSearchApi
        .post('/prisoner-search/prisoner-numbers', `{"prisonerNumbers":${JSON.stringify(prisonerNumbers)}}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const page1 = await prisonerSearchClient.getPrisonersByPrisonerNumbers(prisonerNumbers)

      expect(page1).toEqual({
        totalPages: Math.ceil(numberOfResults / config.apis.prisonerSearch.pageSize),
        totalElements: numberOfResults,
        content: results.slice(0, config.apis.prisonerSearch.pageSize),
      })

      fakePrisonerSearchApi
        .post('/prisoner-search/prisoner-numbers', `{"prisonerNumbers":${JSON.stringify(prisonerNumbers)}}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const page2 = await prisonerSearchClient.getPrisonersByPrisonerNumbers(prisonerNumbers, 1)

      expect(page2).toEqual({
        totalPages: Math.ceil(numberOfResults / config.apis.prisonerSearch.pageSize),
        totalElements: numberOfResults,
        content: results.slice(config.apis.prisonerSearch.pageSize),
      })
    })
  })
})
