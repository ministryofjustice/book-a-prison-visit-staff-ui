import { VisitorListItem } from '../@types/bapv'
import { Contact } from '../data/prisonerContactRegistryApiTypes'
import { Visit } from '../data/orchestrationApiTypes'
import TestData from '../routes/testutils/testData'
import VisitService from './visitService'
import {
  createMockHmppsAuthClient,
  createMockPrisonerContactRegistryApiClient,
  createMockVisitSchedulerApiClient,
} from '../data/testutils/mocks'
import { createMockVisitSessionsService } from './testutils/mocks'

const token = 'some token'

describe('Visit service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const prisonerContactRegistryApiClient = createMockPrisonerContactRegistryApiClient()
  const visitSchedulerApiClient = createMockVisitSchedulerApiClient()
  const visitSessionsService = createMockVisitSessionsService()

  let visitService: VisitService

  const PrisonerContactRegistryApiClientFactory = jest.fn()
  const VisitSchedulerApiClientFactory = jest.fn()

  const availableSupportTypes = TestData.supportTypes()

  beforeEach(() => {
    PrisonerContactRegistryApiClientFactory.mockReturnValue(prisonerContactRegistryApiClient)
    VisitSchedulerApiClientFactory.mockReturnValue(visitSchedulerApiClient)

    visitService = new VisitService(
      PrisonerContactRegistryApiClientFactory,
      VisitSchedulerApiClientFactory,
      visitSessionsService,
      hmppsAuthClient,
    )
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getVisit', () => {
    const visit: Visit = {
      applicationReference: 'aaa-bbb-ccc',
      reference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId: 'HEI',
      visitRoom: 'visit room',
      visitType: 'SOCIAL',
      visitStatus: 'BOOKED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-02-14T10:00:00',
      endTimestamp: '2022-02-14T11:15:00',
      visitNotes: [],
      visitContact: {
        name: 'John Smith',
        telephone: '01234 567890',
      },
      visitors: [
        {
          nomisPersonId: 4321,
        },
        {
          nomisPersonId: 4324,
        },
      ],
      visitorSupport: [
        {
          type: 'WHEELCHAIR',
        },
        {
          type: 'OTHER',
          text: 'custom request',
        },
      ],
      createdBy: 'user1',
      createdTimestamp: '2022-02-14T10:00:00',
      modifiedTimestamp: '2022-02-14T10:05:00',
    }

    describe('getFullVisitDetails', () => {
      it('should return full details of visit, visitors and additional support options', async () => {
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
                restrictionType: 'CLOSED',
                restrictionTypeDescription: 'Closed',
                startDate: '2022-01-03',
                globalRestriction: false,
              },
            ],
            addresses: [
              {
                street: '123 The Street',
                town: 'Coventry',
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

        const expectedResult: { visit: Visit; visitors: VisitorListItem[]; additionalSupport: string[] } = {
          visit,
          visitors: [
            {
              personId: 4321,
              name: 'Jeanette Smith',
              dateOfBirth: '1986-07-28',
              adult: true,
              relationshipDescription: 'Sister',
              address: '123 The Street,<br>Coventry',
              restrictions: contacts[0].restrictions,
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
          ],
          additionalSupport: ['Wheelchair ramp', 'custom request'],
        }

        prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue(contacts)
        visitSessionsService.getAvailableSupportOptions.mockResolvedValue(availableSupportTypes)
        visitSchedulerApiClient.getVisit.mockResolvedValue(visit)

        const result = await visitService.getFullVisitDetails({ username: 'user', reference: 'ab-cd-ef-gh' })

        expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(1)
        expect(visitSessionsService.getAvailableSupportOptions).toHaveBeenCalledTimes(1)
        expect(visitSchedulerApiClient.getVisit).toHaveBeenCalledTimes(1)
        expect(result).toEqual(expectedResult)
      })
    })
  })
})
