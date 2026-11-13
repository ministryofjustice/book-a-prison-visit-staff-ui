import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PrisonerSearchClient from './prisonerSearchClient'
import TestData from '../routes/testutils/testData'

describe('PrisonerSearchClient', () => {
  let prisonerSearchClient: PrisonerSearchClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  const prisonId = 'HEI'

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>

    prisonerSearchClient = new PrisonerSearchClient(mockAuthenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
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
      nock(config.apis.prisonerSearch.url)
        .get('/prison/HEI/prisoners')
        .query({
          term: 'test',
          page: '0',
          size: config.apis.prisonerSearch.pageSize,
        })
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, results)

      const response = await prisonerSearchClient.getPrisoners('test', prisonId)

      expect(response).toEqual(results)
      expect(mockAuthenticationClient.getToken).toHaveBeenCalledTimes(1)
    })
  })

  describe('getPrisonerById', () => {
    it('should return data for single prisoner by prisoner ID', async () => {
      const prisoner = TestData.prisoner()

      nock(config.apis.prisonerSearch.url)
        .get('/prisoner/A1234BC')
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, prisoner)

      const response = await prisonerSearchClient.getPrisonerById('A1234BC')

      expect(response).toEqual(prisoner)
      expect(mockAuthenticationClient.getToken).toHaveBeenCalledTimes(1)
    })
  })
})
