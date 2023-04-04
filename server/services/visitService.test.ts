import { VisitorListItem } from '../@types/bapv'
import { Visit } from '../data/orchestrationApiTypes'
import TestData from '../routes/testutils/testData'
import VisitService from './visitService'
import {
  createMockHmppsAuthClient,
  createMockOrchestrationApiClient,
  createMockPrisonerContactRegistryApiClient,
} from '../data/testutils/mocks'
import { createMockVisitSessionsService } from './testutils/mocks'

const token = 'some token'

describe('Visit service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()
  const prisonerContactRegistryApiClient = createMockPrisonerContactRegistryApiClient()
  const visitSessionsService = createMockVisitSessionsService()

  let visitService: VisitService

  const OrchestrationApiClientFactory = jest.fn()
  const PrisonerContactRegistryApiClientFactory = jest.fn()

  const availableSupportTypes = TestData.supportTypes()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    PrisonerContactRegistryApiClientFactory.mockReturnValue(prisonerContactRegistryApiClient)

    visitService = new VisitService(
      OrchestrationApiClientFactory,
      PrisonerContactRegistryApiClientFactory,
      visitSessionsService,
      hmppsAuthClient,
    )
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Get Visit', () => {
    describe('getFullVisitDetails', () => {
      const visitHistoryDetails = TestData.VisitHistoryDetails({
        visit: TestData.visit({
          visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'OTHER', text: 'custom request' }],
        }),
      })

      const childDateOfBirth = `${new Date().getFullYear() - 4}-03-02`
      const contacts = [
        TestData.contact({}),
        TestData.contact({
          personId: 4322,
          firstName: 'Anne',
          dateOfBirth: childDateOfBirth,
          relationshipCode: 'NIE',
          relationshipDescription: 'Niece',
          addresses: [],
        }),
      ]

      it('should return full details of visit, visitors and additional support options', async () => {
        const expectedResult: { visit: Visit; visitors: VisitorListItem[]; additionalSupport: string[] } = {
          visit: visitHistoryDetails.visit,
          visitors: [
            {
              personId: 4321,
              name: 'Jeanette Smith',
              dateOfBirth: '1986-07-28',
              adult: true,
              relationshipDescription: 'Wife',
              address:
                'Premises,<br>Flat 23B,<br>123 The Street,<br>Springfield,<br>Coventry,<br>West Midlands,<br>C1 2AB,<br>England',
              restrictions: contacts[0].restrictions,
              banned: false,
            },
            {
              personId: 4322,
              name: 'Anne Smith',
              dateOfBirth: childDateOfBirth,
              adult: false,
              relationshipDescription: 'Niece',
              address: 'Not entered',
              restrictions: [],
              banned: false,
            },
          ],
          additionalSupport: ['Wheelchair ramp', 'custom request'],
        }

        prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue(contacts)
        visitSessionsService.getAvailableSupportOptions.mockResolvedValue(availableSupportTypes)
        orchestrationApiClient.getVisitHistory.mockResolvedValue(visitHistoryDetails)

        const result = await visitService.getFullVisitDetails({ username: 'user', reference: 'ab-cd-ef-gh' })

        expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(1)
        expect(visitSessionsService.getAvailableSupportOptions).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitHistory).toHaveBeenCalledTimes(1)
        expect(result).toEqual(expectedResult)
      })
    })
  })
})
