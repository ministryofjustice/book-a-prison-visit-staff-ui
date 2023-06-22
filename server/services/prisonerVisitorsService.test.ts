import PrisonerVisitorsService from './prisonerVisitorsService'
import { Contact } from '../data/prisonerContactRegistryApiTypes'
import { VisitorListItem } from '../@types/bapv'
import { createMockHmppsAuthClient, createMockPrisonerContactRegistryApiClient } from '../data/testutils/mocks'

const token = 'some token'

describe('Prisoner visitor service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const prisonerContactRegistryApiClient = createMockPrisonerContactRegistryApiClient()
  let prisonerVisitorsService: PrisonerVisitorsService

  const PrisonerContactRegistryApiClientFactory = jest.fn()

  describe('getVisitors', () => {
    const offenderNo = 'A1234BC'

    beforeEach(() => {
      PrisonerContactRegistryApiClientFactory.mockReturnValue(prisonerContactRegistryApiClient)
      prisonerVisitorsService = new PrisonerVisitorsService(PrisonerContactRegistryApiClientFactory, hmppsAuthClient)
      hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('Retrieves and processes prisoner and approved visitor details', async () => {
      const childDateOfBirth = `${new Date().getFullYear() - 4}-03-02`
      const contacts: Contact[] = [
        {
          personId: 4321,
          firstName: 'Jeanette',
          lastName: 'Smith',
          dateOfBirth: '1986-07-28',
          relationshipCode: 'SIS',
          relationshipDescription: 'Sister',
          contactType: 'S',
          approvedVisitor: true,
          emergencyContact: false,
          nextOfKin: false,
          restrictions: [
            {
              restrictionType: 'BAN',
              restrictionTypeDescription: 'Banned',
              startDate: '2022-01-01',
              expiryDate: '2022-07-31',
              globalRestriction: false,
              comment: 'Ban details',
            },
            {
              restrictionType: 'RESTRICTED',
              restrictionTypeDescription: 'Restricted',
              startDate: '2022-01-02',
              globalRestriction: false,
            },
            {
              restrictionType: 'CLOSED',
              restrictionTypeDescription: 'Closed',
              startDate: '2022-01-03',
              globalRestriction: false,
            },
            {
              restrictionType: 'NONCON',
              restrictionTypeDescription: 'Non-Contact Visit',
              startDate: '2022-01-04',
              globalRestriction: false,
            },
            {
              restrictionType: 'DIHCON',
              restrictionTypeDescription: 'Disability Health Concerns',
              startDate: '2022-01-05',
              globalRestriction: false,
              comment: 'This restriction should not display',
            },
          ],
          addresses: [
            {
              street: 'non primary addr',
              primary: false,
              noFixedAddress: false,
              phones: [],
              addressUsages: [],
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
              noFixedAddress: false,
              phones: [],
              addressUsages: [],
            },
          ],
        },
        {
          personId: 4322,
          firstName: 'Bob',
          lastName: 'Smith',
          relationshipCode: 'BRO',
          relationshipDescription: 'Brother',
          contactType: 'S',
          approvedVisitor: true,
          emergencyContact: false,
          nextOfKin: false,
          restrictions: [],
          addresses: [
            {
              street: '1st listed address', // no primary; should show first
              primary: false,
              noFixedAddress: false,
              phones: [],
              addressUsages: [],
            },
            {
              street: '2nd listed address',
              primary: false,
              noFixedAddress: false,
              phones: [],
              addressUsages: [],
            },
          ],
        },
        {
          personId: 4323,
          firstName: 'John',
          lastName: 'Jones',
          relationshipCode: 'FRI',
          relationshipDescription: 'Friend',
          contactType: 'S',
          approvedVisitor: false, // should not show in visitor list
          emergencyContact: false,
          nextOfKin: false,
          restrictions: [],
          addresses: [],
        },
        {
          personId: 4324,
          firstName: 'Anne',
          lastName: 'Smith',
          relationshipCode: 'NIE',
          dateOfBirth: childDateOfBirth,
          relationshipDescription: 'Niece',
          contactType: 'S',
          approvedVisitor: true,
          emergencyContact: false,
          nextOfKin: false,
          restrictions: [],
          addresses: [],
        },
      ]

      prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue(contacts)

      const results = await prisonerVisitorsService.getVisitors(offenderNo, 'user')

      expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(1)
      expect(results).toEqual([
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
              globalRestriction: false,
              comment: 'Ban details',
            },
            {
              restrictionType: 'RESTRICTED',
              restrictionTypeDescription: 'Restricted',
              startDate: '2022-01-02',
              globalRestriction: false,
            },
            {
              restrictionType: 'CLOSED',
              restrictionTypeDescription: 'Closed',
              startDate: '2022-01-03',
              globalRestriction: false,
            },
            {
              restrictionType: 'NONCON',
              restrictionTypeDescription: 'Non-Contact Visit',
              startDate: '2022-01-04',
              globalRestriction: false,
            },
          ],
          banned: true,
        },
        {
          personId: 4322,
          name: 'Bob Smith',
          dateOfBirth: undefined,
          adult: true,
          relationshipDescription: 'Brother',
          address: '1st listed address',
          restrictions: [],
          banned: false,
        },
        {
          personId: 4324,
          name: 'Anne Smith',
          dateOfBirth: childDateOfBirth,
          adult: false,
          relationshipDescription: 'Niece',
          address: 'Not entered',
          restrictions: [],
          banned: false,
        },
      ] as VisitorListItem[])
    })

    it('should handle prisoner having no contacts', async () => {
      prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue([])

      const results = await prisonerVisitorsService.getVisitors(offenderNo, 'user')
      expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(1)
      expect(results).toEqual([])
    })
  })
})
