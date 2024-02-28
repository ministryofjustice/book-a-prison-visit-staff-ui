import { AvailableComponent } from '../data/frontendComponentsClient'
import { createMockFrontendComponentsClient } from '../data/testutils/mocks'
import FrontendComponentsService from './frontendComponentsService'

describe('FrontendComponentsService', () => {
  const frontendComponentsClient = createMockFrontendComponentsClient()
  let frontendComponentsService: FrontendComponentsService
  const FrontendComponentsClientBuilder = jest.fn()

  const components: AvailableComponent[] = ['header', 'footer']
  const userToken = 'user1'

  beforeEach(() => {
    FrontendComponentsClientBuilder.mockReturnValue(frontendComponentsClient)
    frontendComponentsService = new FrontendComponentsService(FrontendComponentsClientBuilder)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getComponents', () => {
    it('should call API and return component data', async () => {
      const response = {
        header: {
          html: 'header html',
          css: ['header css'],
          javascript: ['header js'],
        },
        footer: {
          html: 'footer html',
          css: ['footer css'],
          javascript: ['footer js'],
        },
      }
      frontendComponentsClient.getComponents.mockResolvedValue(response)

      const result = await frontendComponentsService.getComponents(components, userToken)

      expect(frontendComponentsClient.getComponents).toHaveBeenCalledWith(components, userToken)
      expect(result).toStrictEqual(response)
    })
  })
})
