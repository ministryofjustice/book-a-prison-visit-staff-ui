import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PrisonerSearchClient from './prisonerSearchClient'
import TestData from '../routes/testutils/testData'

describe('prisonSearchClientBuilder', () => {
  let prisonerSearchClient: PrisonerSearchClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>
  let fakePrisonerSearchApi: nock.Scope

  const token = 'test-system-client'
  const prisonId = 'HEI'

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue(token),
    } as unknown as jest.Mocked<AuthenticationClient>

    fakePrisonerSearchApi = nock(config.apis.prisonerSearch.url)

    prisonerSearchClient = new PrisonerSearchClient(mockAuthenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  afterAll(() => {
    nock.restore()
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
      expect(mockAuthenticationClient.getToken).toHaveBeenCalledTimes(1)
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
      expect(mockAuthenticationClient.getToken).toHaveBeenCalledTimes(1)
    })
  })
})
