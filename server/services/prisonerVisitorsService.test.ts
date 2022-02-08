import { NotFound } from 'http-errors'
import PrisonerVisitorsService from './prisonerVisitorsService'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerContactRegistryApiClient from '../data/prisonerContactRegistryApiClient'
import { PageOfPrisonerBookingSummary } from '../data/prisonApiTypes'

jest.mock('../data/prisonApiClient')
jest.mock('../data/prisonerContactRegistryApiClient')

const prisonApiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>
const prisonerContactRegistryApiClient = new PrisonerContactRegistryApiClient(
  null
) as jest.Mocked<PrisonerContactRegistryApiClient>

describe('Prisoner visitor service', () => {
  let prisonApiClientBuilder
  let prisonerContactRegistryApiClientBuilder
  let prisonerVisitorsService: PrisonerVisitorsService
  let systemToken

  describe('getVisitors', () => {
    const offenderNo = 'A1234BC'

    beforeEach(() => {
      systemToken = async (user: string): Promise<string> => `${user}-token-1`
      prisonApiClientBuilder = jest.fn().mockReturnValue(prisonApiClient)
      prisonerContactRegistryApiClientBuilder = jest.fn().mockReturnValue(prisonerContactRegistryApiClient)
      prisonerVisitorsService = new PrisonerVisitorsService(
        prisonApiClientBuilder,
        prisonerContactRegistryApiClientBuilder,
        systemToken
      )
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('Retrieves and processes prisoner and visitor details', async () => {
      const bookings = <PageOfPrisonerBookingSummary>{
        content: [
          {
            offenderNo: 'A1234BC',
            firstName: 'JOHN',
            lastName: 'SMITH',
            agencyId: 'HEI',
          },
        ],
        numberOfElements: 1,
      }

      const childDateOfBirth = `${new Date().getFullYear() - 4}-03-02`
      const contacts = [
        {
          personId: 4321,
          firstName: 'Jeanette',
          lastName: 'Smith',
          dateOfBirth: '1986-07-28',
          relationshipDescription: 'Sister',
          approvedVisitor: true,
          restrictions: [
            {
              restrictionType: 'BAN',
              restrictionTypeDescription: 'Banned',
              startDate: '2022-01-01',
              expiryDate: '2022-07-31',
              comment: 'Ban details',
            },
            {
              restrictionType: 'RESTRICTED',
              restrictionTypeDescription: 'Restricted',
              startDate: '2022-01-02',
            },
            {
              restrictionType: 'CLOSED',
              restrictionTypeDescription: 'Closed',
              startDate: '2022-01-03',
            },
            {
              restrictionType: 'NONCON',
              restrictionTypeDescription: 'Non-Contact Visit',
              startDate: '2022-01-04',
            },
            {
              restrictionType: 'DIHCON',
              restrictionTypeDescription: 'Disability Health Concerns',
              startDate: '2022-01-05',
              comment: 'This restriction should not display',
            },
          ],
          addresses: [
            {
              street: 'non primary addr',
              primary: false,
            },
            {
              flat: '23B',
              premise: 'Premises',
              street: '123 The Street',
              locality: 'Springfield',
              town: 'Coventry',
              postalCode: 'C1 2AB',
              county: 'West Midlands',
              country: 'England',
              primary: true,
            },
          ],
        },
        {
          personId: 4322,
          firstName: 'Bob',
          lastName: 'Smith',
          relationshipDescription: 'Brother',
          approvedVisitor: true,
          // @ts-expect-error implicit any[]
          restrictions: [],
          addresses: [
            {
              street: '1st listed address', // no primary; should show first
              primary: false,
            },
            {
              street: '2nd listed address',
              primary: false,
            },
          ],
        },
        {
          personId: 4323,
          firstName: 'John',
          lastName: 'Jones',
          relationshipDescription: 'Friend',
          approvedVisitor: false, // should not show in visitor list
          restrictions: [],
          addresses: [],
        },
        {
          personId: 4324,
          firstName: 'Anne',
          lastName: 'Smith',
          dateOfBirth: childDateOfBirth,
          relationshipDescription: 'Niece',
          approvedVisitor: true,
          restrictions: [],
          addresses: [],
        },
      ]

      prisonApiClient.getBookings.mockResolvedValue(bookings)
      // @ts-expect-error not assignable to type Contact[]
      prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue(contacts)

      const results = await prisonerVisitorsService.getVisitors(offenderNo, 'user')

      expect(prisonApiClient.getBookings).toHaveBeenCalledTimes(1)
      expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(1)
      expect(results).toEqual({
        prisonerName: 'John Smith',
        visitorList: [
          {
            personId: 4321,
            name: 'Jeanette Smith',
            dateOfBirth: '1986-07-28',
            adult: true,
            relationshipDescription: 'Sister',
            address:
              'Premises,<br>Flat 23B,<br>123 The Street,<br>Springfield,<br>Coventry,<br>West Midlands,<br>C1 2AB,<br>England',
            restrictions: [
              {
                restrictionType: 'BAN',
                restrictionTypeDescription: 'Banned',
                startDate: '2022-01-01',
                expiryDate: '2022-07-31',
                comment: 'Ban details',
              },
              {
                restrictionType: 'RESTRICTED',
                restrictionTypeDescription: 'Restricted',
                startDate: '2022-01-02',
              },
              {
                restrictionType: 'CLOSED',
                restrictionTypeDescription: 'Closed',
                startDate: '2022-01-03',
              },
              {
                restrictionType: 'NONCON',
                restrictionTypeDescription: 'Non-Contact Visit',
                startDate: '2022-01-04',
              },
            ],
            selected: false,
          },
          {
            personId: 4322,
            name: 'Bob Smith',
            dateOfBirth: undefined,
            adult: undefined,
            relationshipDescription: 'Brother',
            address: '1st listed address',
            restrictions: [],
            selected: false,
          },
          {
            personId: 4324,
            name: 'Anne Smith',
            dateOfBirth: childDateOfBirth,
            adult: false,
            relationshipDescription: 'Niece',
            address: 'Not entered',
            restrictions: [],
            selected: false,
          },
        ],
      })
    })

    it('Throws 404 if no bookings found for criteria', async () => {
      // e.g. offenderNo doesn't exist - or not at specified prisonId
      const bookings = <PageOfPrisonerBookingSummary>{
        content: [],
        numberOfElements: 0,
      }

      prisonApiClient.getBookings.mockResolvedValue(bookings)

      await expect(async () => {
        await prisonerVisitorsService.getVisitors(offenderNo, 'user')
      }).rejects.toBeInstanceOf(NotFound)
    })
  })
})
