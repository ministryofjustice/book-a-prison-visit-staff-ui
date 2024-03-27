import { NotFound } from 'http-errors'
import { VisitInformation, VisitSessionData, VisitorListItem } from '../@types/bapv'
import {
  ApplicationDto,
  ApplicationMethodType,
  CancelVisitOrchestrationDto,
  NotificationType,
  Visit,
  VisitHistoryDetails,
  VisitRestriction,
} from '../data/orchestrationApiTypes'
import TestData from '../routes/testutils/testData'
import VisitService from './visitService'
import {
  createMockHmppsAuthClient,
  createMockOrchestrationApiClient,
  createMockPrisonerContactRegistryApiClient,
} from '../data/testutils/mocks'

const token = 'some token'

const prisonId = 'HEI'

describe('Visit service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()
  const prisonerContactRegistryApiClient = createMockPrisonerContactRegistryApiClient()

  let visitService: VisitService

  const OrchestrationApiClientFactory = jest.fn()
  const PrisonerContactRegistryApiClientFactory = jest.fn()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    PrisonerContactRegistryApiClientFactory.mockReturnValue(prisonerContactRegistryApiClient)

    visitService = new VisitService(
      OrchestrationApiClientFactory,
      PrisonerContactRegistryApiClientFactory,
      hmppsAuthClient,
    )
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Visit booking, update and cancellation', () => {
    describe('bookVisit', () => {
      it('should book a visit (change status from RESERVED to BOOKED)', async () => {
        const applicationReference = 'aaa-bbb-ccc'
        const applicationMethod: ApplicationMethodType = 'NOT_KNOWN'

        const visit: Partial<Visit> = {
          applicationReference,
          reference: 'ab-cd-ef-gh',
          visitStatus: 'BOOKED',
        }

        orchestrationApiClient.bookVisit.mockResolvedValue(visit as Visit)
        const result = await visitService.bookVisit({ username: 'user', applicationReference, applicationMethod })

        expect(orchestrationApiClient.bookVisit).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.bookVisit).toHaveBeenCalledWith(applicationReference, applicationMethod)
        expect(result).toStrictEqual(visit)
      })
    })

    describe('cancelVisit', () => {
      it('should cancel a visit, giving the status code and reason', async () => {
        const expectedResult: Visit = {
          applicationReference: 'aaa-bbb-ccc',
          reference: 'ab-cd-ef-gh',
          prisonerId: 'AF34567G',
          prisonId: 'HEI',
          sessionTemplateReference: 'v9d.7ed.7u',
          visitRoom: 'A1 L3',
          visitType: 'SOCIAL',
          visitStatus: 'CANCELLED',
          visitRestriction: 'OPEN',
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
          visitNotes: [
            {
              type: 'VISIT_OUTCOMES',
              text: 'VISITOR_CANCELLED',
            },
            {
              type: 'STATUS_CHANGED_REASON',
              text: 'cancellation reason',
            },
          ],
          visitors: [
            {
              nomisPersonId: 1234,
            },
          ],
          visitorSupport: { description: '' },
          createdTimestamp: '2022-02-14T10:00:00',
          modifiedTimestamp: '2022-02-14T10:05:00',
        }

        const cancelVisitDto: CancelVisitOrchestrationDto = {
          cancelOutcome: {
            outcomeStatus: 'VISITOR_CANCELLED',
            text: 'cancellation reason',
          },
          applicationMethodType: 'NOT_KNOWN',
        }

        orchestrationApiClient.cancelVisit.mockResolvedValue(expectedResult)
        const result = await visitService.cancelVisit({
          username: 'user',
          reference: expectedResult.reference,
          cancelVisitDto,
        })

        expect(orchestrationApiClient.cancelVisit).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.cancelVisit).toHaveBeenCalledWith(expectedResult.reference, cancelVisitDto)
        expect(result).toEqual(expectedResult)
      })
    })

    describe('changeVisitApplication', () => {
      it('should change an existing reserved visit and return the visit data', async () => {
        const visitSessionData = <VisitSessionData>{
          applicationReference: 'aaa-bbb-ccc',
        }

        const application = <ApplicationDto>{
          reference: 'aaa-bbb-ccc',
        }

        orchestrationApiClient.changeVisitApplication.mockResolvedValue(application)

        const result = await visitService.changeVisitApplication({
          username: 'user',
          visitSessionData,
        })

        expect(orchestrationApiClient.changeVisitApplication).toHaveBeenCalledWith(visitSessionData)
        expect(result).toStrictEqual(application)
      })
    })

    describe('createVisitApplicationFromVisit', () => {
      it('should return a new Visit Application from a BOOKED visit', async () => {
        const visitSessionData = <VisitSessionData>{
          visitReference: 'ab-cd-ef-gh',
        }

        const application = <ApplicationDto>{
          reference: 'aaa-bbb-ccc',
        }

        orchestrationApiClient.createVisitApplicationFromVisit.mockResolvedValue(application)
        const result = await visitService.createVisitApplicationFromVisit({ username: 'user', visitSessionData })

        expect(orchestrationApiClient.createVisitApplicationFromVisit).toHaveBeenCalledWith(visitSessionData)
        expect(result).toStrictEqual(application)
      })
    })

    describe('createVisitApplication', () => {
      it('should create a new visit Application and return the application data', async () => {
        const visitSessionData = <VisitSessionData>{
          applicationReference: 'aaa-bbb-ccc',
        }

        const application = <ApplicationDto>{
          reference: 'aaa-bbb-ccc',
        }

        orchestrationApiClient.createVisitApplication.mockResolvedValue(application)
        const result = await visitService.createVisitApplication({ username: 'user', visitSessionData })

        expect(orchestrationApiClient.createVisitApplication).toHaveBeenCalledWith(visitSessionData)
        expect(result).toStrictEqual(application)
      })
    })
  })

  describe('Get Visit(s)', () => {
    const visit = TestData.visit()

    describe('getVisit', () => {
      it('should return VisitInformation given a visit reference and matching prisonId', async () => {
        orchestrationApiClient.getVisit.mockResolvedValue(visit)
        const result = await visitService.getVisit({ username: 'user', reference: 'ab-cd-ef-gh', prisonId })

        expect(orchestrationApiClient.getVisit).toHaveBeenCalledTimes(1)
        expect(result).toEqual(<VisitInformation>{
          reference: 'ab-cd-ef-gh',
          prisonNumber: 'A1234BC',
          prisonerName: '',
          mainContact: 'Jeanette Smith',
          visitDate: '14 January 2022',
          visitTime: '10am to 11am',
          visitStatus: 'BOOKED',
        })
      })

      it('should throw a 404 if the visit is not at the given prisonId', async () => {
        orchestrationApiClient.getVisit.mockResolvedValue(visit)

        await expect(async () => {
          await visitService.getVisit({
            username: 'user',
            reference: 'ab-cd-ef-gh',
            prisonId: 'BLI',
          })

          expect(orchestrationApiClient.getVisit).toHaveBeenCalledTimes(1)
        }).rejects.toBeInstanceOf(NotFound)
      })
    })

    describe('getFullVisitDetails', () => {
      const visitHistoryDetails = TestData.visitHistoryDetails({
        visit: TestData.visit({
          visitorSupport: { description: 'Wheelchair, custom request' },
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

      beforeEach(() => {
        prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue(contacts)
        orchestrationApiClient.getVisitHistory.mockResolvedValue(visitHistoryDetails)
        orchestrationApiClient.getVisitNotifications.mockResolvedValue(['PRISONER_RELEASED_EVENT'])
      })

      it('should return full details of visit, visitors, notifications and additional support options', async () => {
        const expectedResult: {
          visitHistoryDetails: VisitHistoryDetails
          visitors: VisitorListItem[]
          notifications: NotificationType[]
          additionalSupport: string
        } = {
          visitHistoryDetails,
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
          notifications: ['PRISONER_RELEASED_EVENT'],
          additionalSupport: 'Wheelchair, custom request',
        }

        const result = await visitService.getFullVisitDetails({ username: 'user', reference: 'ab-cd-ef-gh' })

        expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitHistory).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitNotifications).toHaveBeenCalledTimes(1)
        expect(result).toStrictEqual(expectedResult)
      })
    })

    describe('getFutureVisits', () => {
      it('should return an array of upcoming VisitInformation for an offender', async () => {
        const visits: Visit[] = [visit]

        orchestrationApiClient.getFutureVisits.mockResolvedValue(visits)
        const result = await visitService.getFutureVisits({
          username: 'user',
          prisonerId: 'A1234BC',
        })

        expect(orchestrationApiClient.getFutureVisits).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getFutureVisits).toHaveBeenCalledWith('A1234BC')
        expect(result).toEqual(<VisitInformation[]>[
          {
            reference: 'ab-cd-ef-gh',
            prisonNumber: 'A1234BC',
            prisonerName: '',
            mainContact: 'Jeanette Smith',
            visitDate: '14 January 2022',
            visitTime: '10am to 11am',
            visitStatus: 'BOOKED',
          },
        ])
      })

      it('should return an empty array for an offender with no upcoming visits', async () => {
        const visits: Visit[] = []

        orchestrationApiClient.getFutureVisits.mockResolvedValue(visits)
        const result = await visitService.getFutureVisits({
          username: 'user',
          prisonerId: 'A1234BC',
        })

        expect(orchestrationApiClient.getFutureVisits).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getFutureVisits).toHaveBeenCalledWith('A1234BC')
        expect(result).toEqual([])
      })
    })

    describe('getVisitsBySessionTemplate', () => {
      it('should return visit previews for given session template reference, date, prison and restriction', async () => {
        const reference = 'v9d.7ed.7u'
        const sessionDate = '2024-01-31'
        const visitRestrictions: VisitRestriction = 'OPEN'
        const visitPreviews = [TestData.visitPreview()]

        orchestrationApiClient.getVisitsBySessionTemplate.mockResolvedValue(visitPreviews)

        const result = await visitService.getVisitsBySessionTemplate({
          username: 'user',
          prisonId,
          reference,
          sessionDate,
          visitRestrictions,
        })

        expect(orchestrationApiClient.getVisitsBySessionTemplate).toHaveBeenCalledWith(
          prisonId,
          reference,
          sessionDate,
          visitRestrictions,
        )
        expect(result).toStrictEqual(visitPreviews)
      })
    })

    describe('getVisitsWithoutSessionTemplate', () => {
      it('should return visit previews for given date and prison (for migrated visits that have no session template)', async () => {
        const sessionDate = '2024-01-31'
        const visitPreviews = [TestData.visitPreview()]

        orchestrationApiClient.getVisitsBySessionTemplate.mockResolvedValue(visitPreviews)

        const result = await visitService.getVisitsWithoutSessionTemplate({
          username: 'user',
          prisonId,
          sessionDate,
        })

        expect(orchestrationApiClient.getVisitsBySessionTemplate).toHaveBeenCalledWith(
          prisonId,
          undefined,
          sessionDate,
          undefined,
        )
        expect(result).toStrictEqual(visitPreviews)
      })
    })
  })
})
