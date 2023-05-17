import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import AdditionalSupportService from './additionalSupportService'

const token = 'some token'

describe('Additional support service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let additionalSupportService: AdditionalSupportService

  const OrchestrationApiClientFactory = jest.fn()

  const availableSupportTypes = TestData.supportTypes()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    additionalSupportService = new AdditionalSupportService(OrchestrationApiClientFactory, hmppsAuthClient)

    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getAdditionalSupportOptions', () => {
    it('should return an array of available support options', async () => {
      orchestrationApiClient.getAvailableSupportOptions.mockResolvedValue(availableSupportTypes)

      const results = await additionalSupportService.getAvailableSupportOptions('user')

      expect(orchestrationApiClient.getAvailableSupportOptions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(availableSupportTypes)
    })
  })
})
