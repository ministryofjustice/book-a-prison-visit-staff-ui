import TestData from '../../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../../data/testutils/mocks'
import VisitOrdersService, { VoHistoryPage } from './visitOrdersService'

const token = 'some token'
const username = 'user1'

const prisonId = 'HEI'
const prisonerId = 'A1234BC'

describe('Visit orders service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let visitOrdersService: VisitOrdersService

  const OrchestrationApiClientFactory = jest.fn()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)

    visitOrdersService = new VisitOrdersService(OrchestrationApiClientFactory, hmppsAuthClient)
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getVoHistory', () => {
    it('should return visit order history page data for given prisoner', async () => {
      const voHistoryDetails = TestData.visitOrderHistoryDetailsDto({
        visitOrderHistory: [
          TestData.visitOrderHistoryDto({ visitOrderHistoryType: 'VO_EXPIRATION', attributes: [], userName: 'SYSTEM' }),
        ],
      })

      orchestrationApiClient.getVoHistory.mockResolvedValue(voHistoryDetails)

      const result = await visitOrdersService.getVoHistory({ username, prisonId, prisonerId })

      expect(result).toStrictEqual<VoHistoryPage>({
        prisonerId: voHistoryDetails.prisonerId,
        firstName: voHistoryDetails.firstName,
        lastName: voHistoryDetails.lastName,
        convictedStatus: voHistoryDetails.convictedStatus,
        incentiveLevel: voHistoryDetails.incentiveLevel,
        category: voHistoryDetails.category,
        voHistoryRows: [
          [
            // date
            { text: '2025-12-01', classes: 'bapv-secondary-text' },
            // reason
            { html: 'VO expired', classes: 'bapv-secondary-text' },
            // VO change
            { text: '1', classes: 'bapv-secondary-text' },
            // VO balance
            { text: '5', classes: 'bapv-secondary-text' },
            // PVO change
            { text: '0', classes: 'bapv-secondary-text' },
            // PVO balance
            { text: '2', classes: 'bapv-secondary-text' },
          ],
        ],
      })

      expect(orchestrationApiClient.getVoHistory).toHaveBeenCalledWith({ prisonId, prisonerId })
    })

    it('should return visit order history page data with rows styled depending on history item type', async () => {
      const voHistoryDetails = TestData.visitOrderHistoryDetailsDto({
        visitOrderHistory: [
          // Row 0: styled with secondary text colour
          TestData.visitOrderHistoryDto({ visitOrderHistoryType: 'MIGRATION' }),
          // Row 1: no style (default)
          TestData.visitOrderHistoryDto({
            visitOrderHistoryType: 'ALLOCATION_USED_BY_VISIT',
            attributes: [{ attributeType: 'VISIT_REFERENCE', attributeValue: 'ab-cd-ef-gh' }],
          }),
        ],
      })

      orchestrationApiClient.getVoHistory.mockResolvedValue(voHistoryDetails)

      const result = await visitOrdersService.getVoHistory({ username, prisonId, prisonerId })

      // Row 0: all items have secondary colour class
      expect(result.voHistoryRows[0].filter(item => item.classes === 'bapv-secondary-text').length).toBe(6)
      // Row 1: all items have no class
      expect(result.voHistoryRows[1].filter(item => item.classes === '').length).toBe(6)
    })
  })
})
