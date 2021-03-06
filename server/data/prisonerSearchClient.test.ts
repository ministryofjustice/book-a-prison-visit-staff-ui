import nock from 'nock'
import config from '../config'
import { Prisoner } from './prisonerOffenderSearchTypes'
import PrisonerSearchClient, { prisonerSearchClientBuilder } from './prisonerSearchClient'

describe('prisonSearchClientBuilder', () => {
  let fakePrisonerSearchApi: nock.Scope
  let client: PrisonerSearchClient

  const token = 'token-1'

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearch.url)
    client = prisonerSearchClientBuilder(token)
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
        .get('/prison/HEI/prisoners')
        .query({
          term: 'test',
          page: '0',
          size: config.apis.prisonerSearch.pageSize,
        })
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
        .get('/prison/HEI/prisoners')
        .query({
          term: 'test',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getPrisoner('test')

      expect(output).toEqual(results)
    })
  })

  describe('getPrisonerById', () => {
    it('should return data for single prisoner by prisoner ID', async () => {
      const results: Prisoner = {
        lastName: 'FORENAME',
        firstName: 'SURNAME',
        prisonerNumber: 'A1234BC',
        dateOfBirth: '2000-01-01',
        prisonId: 'HEI',
        prisonName: 'HMP Hewell',
        cellLocation: '1-1-C-028',
        restrictedPatient: false,
      }
      fakePrisonerSearchApi.get('/prisoner/A1234BC').matchHeader('authorization', `Bearer ${token}`).reply(200, results)

      const output = await client.getPrisonerById('A1234BC')

      expect(output).toEqual(results)
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

      const output = await client.getPrisonersByPrisonerNumbers(prisonerNumbers)

      expect(output).toEqual({
        totalPages: 1,
        totalElements: 2,
        content: results,
      })
    })

    it('should return data from api with the multiple pages', async () => {
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

      const page1 = await client.getPrisonersByPrisonerNumbers(prisonerNumbers)

      expect(page1).toEqual({
        totalPages: Math.ceil(numberOfResults / config.apis.prisonerSearch.pageSize),
        totalElements: numberOfResults,
        content: results.slice(0, config.apis.prisonerSearch.pageSize),
      })

      fakePrisonerSearchApi
        .post('/prisoner-search/prisoner-numbers', `{"prisonerNumbers":${JSON.stringify(prisonerNumbers)}}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const page2 = await client.getPrisonersByPrisonerNumbers(prisonerNumbers, 1)

      expect(page2).toEqual({
        totalPages: Math.ceil(numberOfResults / config.apis.prisonerSearch.pageSize),
        totalElements: numberOfResults,
        content: results.slice(config.apis.prisonerSearch.pageSize),
      })
    })
  })
})
