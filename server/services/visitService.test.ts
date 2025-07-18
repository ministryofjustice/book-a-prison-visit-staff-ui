import { NotFound } from 'http-errors'
import { VisitInformation, VisitSessionData } from '../@types/bapv'
import {
  ApplicationDto,
  ApplicationMethodType,
  CancelVisitOrchestrationDto,
  Visit,
  VisitRestriction,
} from '../data/orchestrationApiTypes'
import TestData from '../routes/testutils/testData'
import VisitService from './visitService'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'

const token = 'some token'

const prisonId = 'HEI'

describe('Visit service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let visitService: VisitService

  const OrchestrationApiClientFactory = jest.fn()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)

    visitService = new VisitService(OrchestrationApiClientFactory, hmppsAuthClient)
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Visit booking, update and cancellation', () => {
    describe('bookVisit', () => {
      it('should book a visit (complete an application so it is a visit)', async () => {
        const applicationReference = 'aaa-bbb-ccc'
        const applicationMethod: ApplicationMethodType = 'NOT_KNOWN'

        const visit: Partial<Visit> = {
          applicationReference,
          reference: 'ab-cd-ef-gh',
          visitStatus: 'BOOKED',
        }

        orchestrationApiClient.bookVisit.mockResolvedValue(visit as Visit)
        const result = await visitService.bookVisit({
          username: 'user1',
          applicationReference,
          applicationMethod,
          allowOverBooking: false,
        })

        expect(orchestrationApiClient.bookVisit).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.bookVisit).toHaveBeenCalledWith(
          applicationReference,
          applicationMethod,
          false,
          'user1',
        )
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
          visitSubStatus: 'CANCELLED',
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
          actionedBy: 'user1',
          userType: 'STAFF',
        }

        orchestrationApiClient.cancelVisit.mockResolvedValue(expectedResult)
        const result = await visitService.cancelVisit({
          username: 'user',
          reference: expectedResult.reference,
          cancelVisitDto,
        })

        expect(orchestrationApiClient.cancelVisit).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.cancelVisit).toHaveBeenCalledWith(expectedResult.reference, cancelVisitDto)
        expect(result).toStrictEqual(expectedResult)
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

        expect(orchestrationApiClient.createVisitApplicationFromVisit).toHaveBeenCalledWith(visitSessionData, 'user')
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

        expect(orchestrationApiClient.createVisitApplication).toHaveBeenCalledWith(visitSessionData, 'user')
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

    describe('getVisitDetailed', () => {
      it('should return visit details given a visit reference, with alerts and restrictions sorted', async () => {
        const visitDetails = TestData.visitBookingDetails()
        orchestrationApiClient.getVisitDetailed.mockResolvedValue(visitDetails)

        const result = await visitService.getVisitDetailed({ username: 'user', reference: 'ab-cd-ef-gh' })

        expect(orchestrationApiClient.getVisitDetailed).toHaveBeenCalledWith('ab-cd-ef-gh')
        expect(result).toStrictEqual(visitDetails)
      })
    })

    describe('getVisitsBySessionTemplate', () => {
      it('should return visit previews for given session template reference, date, prison and restriction', async () => {
        const reference = 'v9d.7ed.7u'
        const sessionDate = '2024-01-31'
        const visitRestrictions: VisitRestriction[] = ['OPEN', 'CLOSED']
        const visitPreviews = [TestData.visitPreview()]

        orchestrationApiClient.getVisitsBySessionTemplate.mockResolvedValue(visitPreviews)

        const result = await visitService.getVisitsBySessionTemplate({
          username: 'user',
          prisonId,
          reference,
          sessionDate,
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

    describe('getBookedVisitCountByDate', () => {
      it('should return booked visit count for given date', async () => {
        const date = '2024-01-31'

        orchestrationApiClient.getBookedVisitCountByDate.mockResolvedValue(2)

        const result = await visitService.getBookedVisitCountByDate({
          username: 'user',
          prisonId,
          date,
        })

        expect(orchestrationApiClient.getBookedVisitCountByDate).toHaveBeenCalledWith(prisonId, date)
        expect(result).toBe(2)
      })
    })
  })
})
