import { VisitSessionData, VisitorListItem } from '../@types/bapv'
import { OutcomeDto, Visit, VisitHistoryDetails } from '../data/orchestrationApiTypes'
import TestData from '../routes/testutils/testData'
import VisitService from './visitService'
import {
  createMockHmppsAuthClient,
  createMockOrchestrationApiClient,
  createMockPrisonerContactRegistryApiClient,
} from '../data/testutils/mocks'
import { createMockAdditionalSupportService } from './testutils/mocks'

const token = 'some token'

const prisonId = 'HEI'

describe('Visit service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()
  const prisonerContactRegistryApiClient = createMockPrisonerContactRegistryApiClient()
  const additionalSupportService = createMockAdditionalSupportService()

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
      additionalSupportService,
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

        const visit: Partial<Visit> = {
          applicationReference,
          reference: 'ab-cd-ef-gh',
          visitStatus: 'BOOKED',
        }

        orchestrationApiClient.bookVisit.mockResolvedValue(visit as Visit)
        const result = await visitService.bookVisit({ username: 'user', applicationReference })

        expect(orchestrationApiClient.bookVisit).toHaveBeenCalledTimes(1)
        expect(result).toEqual(visit)
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
          visitorSupport: [],
          createdBy: 'user1',
          createdTimestamp: '2022-02-14T10:00:00',
          modifiedTimestamp: '2022-02-14T10:05:00',
        }

        const outcome: OutcomeDto = {
          outcomeStatus: 'VISITOR_CANCELLED',
          text: 'cancellation reason',
        }

        orchestrationApiClient.cancelVisit.mockResolvedValue(expectedResult)
        const result = await visitService.cancelVisit({
          username: 'user',
          reference: expectedResult.reference,
          outcome,
        })

        expect(orchestrationApiClient.cancelVisit).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.cancelVisit).toHaveBeenCalledWith(expectedResult.reference, outcome)
        expect(result).toEqual(expectedResult)
      })
    })

    describe('changeBookedVisit', () => {
      it('should change an existing booked visit and return the visit data with status RESERVED/CHANGING and new applicationReference', async () => {
        const visitSessionData: VisitSessionData = {
          prisoner: {
            offenderNo: 'A1234BC',
            name: 'prisoner name',
            dateOfBirth: '23 May 1988',
            location: 'somewhere',
          },
          visitSlot: {
            id: 'visitId',
            sessionTemplateReference: 'v9d.7ed.7u',
            prisonId,
            startTimestamp: '2022-02-14T10:00:00',
            endTimestamp: '2022-02-14T11:00:00',
            availableTables: 1,
            capacity: 15,
            visitRoom: 'visit room',
            visitRestriction: 'OPEN',
          },
          visitRestriction: 'OPEN',
          visitors: [
            {
              personId: 123,
              name: 'visitor name',
              relationshipDescription: 'relationship desc',
              restrictions: [
                {
                  restrictionType: 'TEST',
                  restrictionTypeDescription: 'test type',
                  startDate: '10 May 2020',
                  expiryDate: '10 May 2022',
                  globalRestriction: false,
                  comment: 'comments',
                },
              ],
              banned: false,
            },
          ],
          visitorSupport: [{ type: 'WHEELCHAIR' }],
          mainContact: {
            phoneNumber: '01234 567890',
            contactName: 'John Smith',
          },
          applicationReference: 'aaa-bbb-ccc',
          visitReference: 'ab-cd-ef-gh',
          visitStatus: 'BOOKED',
        }

        const returnedVisit: Visit = {
          applicationReference: 'ddd-eee-fff',
          reference: visitSessionData.visitReference,
          prisonerId: visitSessionData.prisoner.offenderNo,
          prisonId: 'HEI',
          sessionTemplateReference: 'v9d.7ed.7u',
          visitRoom: visitSessionData.visitSlot.visitRoom,
          visitType: 'SOCIAL',
          visitStatus: 'CHANGING',
          visitRestriction: visitSessionData.visitRestriction,
          startTimestamp: visitSessionData.visitSlot.startTimestamp,
          endTimestamp: visitSessionData.visitSlot.endTimestamp,
          visitNotes: [],
          visitContact: {
            name: 'John Smith',
            telephone: '01234 567890',
          },
          visitors: [
            {
              nomisPersonId: 1234,
            },
          ],
          visitorSupport: [{ type: 'WHEELCHAIR' }],
          createdBy: 'user1',
          createdTimestamp: '2022-02-14T10:00:00',
          modifiedTimestamp: '2022-02-14T10:05:00',
        }

        orchestrationApiClient.changeBookedVisit.mockResolvedValue(returnedVisit)

        const result = await visitService.changeBookedVisit({
          username: 'user',
          visitSessionData,
        })

        expect(orchestrationApiClient.changeBookedVisit).toHaveBeenCalledTimes(1)
        expect(result).toEqual(returnedVisit)
      })
    })

    describe('changeReservedVisit', () => {
      it('should change an existing reserved visit and return the visit data', async () => {
        const visitSessionData: VisitSessionData = {
          prisoner: {
            offenderNo: 'A1234BC',
            name: 'prisoner name',
            dateOfBirth: '23 May 1988',
            location: 'somewhere',
          },
          visitSlot: {
            id: 'visitId',
            prisonId,
            sessionTemplateReference: 'v9d.7ed.7u',
            startTimestamp: '2022-02-14T10:00:00',
            endTimestamp: '2022-02-14T11:00:00',
            availableTables: 1,
            capacity: 15,
            visitRoom: 'visit room',
            visitRestriction: 'OPEN',
          },
          visitRestriction: 'OPEN',
          visitors: [
            {
              personId: 123,
              name: 'visitor name',
              relationshipDescription: 'rel desc',
              restrictions: [
                {
                  restrictionType: 'TEST',
                  restrictionTypeDescription: 'test type',
                  startDate: '10 May 2020',
                  expiryDate: '10 May 2022',
                  globalRestriction: false,
                  comment: 'comments',
                },
              ],
              banned: false,
            },
          ],
          visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'MASK_EXEMPT' }, { type: 'OTHER', text: 'custom request' }],
          mainContact: {
            phoneNumber: '01234 567890',
            contactName: 'John Smith',
          },
          applicationReference: 'aaa-bbb-ccc',
          visitReference: 'ab-cd-ef-gh',
          visitStatus: 'RESERVED',
        }

        const visit: Visit = {
          applicationReference: visitSessionData.applicationReference,
          reference: visitSessionData.visitReference,
          prisonerId: visitSessionData.prisoner.offenderNo,
          prisonId: 'HEI',
          sessionTemplateReference: 'v9d.7ed.7u',
          visitRoom: visitSessionData.visitSlot.visitRoom,
          visitType: 'SOCIAL',
          visitStatus: visitSessionData.visitStatus,
          visitRestriction: visitSessionData.visitRestriction,
          startTimestamp: visitSessionData.visitSlot.startTimestamp,
          endTimestamp: visitSessionData.visitSlot.endTimestamp,
          visitNotes: [],
          visitContact: {
            name: 'John Smith',
            telephone: '01234 567890',
          },
          visitors: [
            {
              nomisPersonId: 1234,
            },
          ],
          visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'MASK_EXEMPT' }, { type: 'OTHER', text: 'custom request' }],
          createdBy: 'user1',
          createdTimestamp: '2022-02-14T10:00:00',
          modifiedTimestamp: '2022-02-14T10:05:00',
        }

        orchestrationApiClient.changeReservedVisit.mockResolvedValue(visit)

        const result = await visitService.changeReservedVisit({
          username: 'user',
          visitSessionData,
        })

        expect(orchestrationApiClient.changeReservedVisit).toHaveBeenCalledTimes(1)
        expect(result).toEqual(visit)
      })
    })

    describe('reserveVisitSlot', () => {
      it('should create a new RESERVED visit and return the visit data', async () => {
        const visitSessionData: VisitSessionData = {
          prisoner: {
            offenderNo: 'A1234BC',
            name: 'prisoner name',
            dateOfBirth: '23 May 1988',
            location: 'somewhere',
          },
          visitSlot: {
            id: '1',
            sessionTemplateReference: 'v9d.7ed.7u',
            prisonId,
            startTimestamp: '2022-02-14T10:00:00',
            endTimestamp: '2022-02-14T11:00:00',
            availableTables: 1,
            capacity: 15,
            visitRoom: 'visit room',
            visitRestriction: 'OPEN',
          },
          visitRestriction: 'OPEN',
          visitors: [
            {
              personId: 123,
              name: 'visitor name',
              relationshipDescription: 'relationship desc',
              restrictions: [
                {
                  restrictionType: 'TEST',
                  restrictionTypeDescription: 'test type',
                  startDate: '10 May 2020',
                  expiryDate: '10 May 2022',
                  globalRestriction: false,
                  comment: 'comments',
                },
              ],
              banned: false,
            },
          ],
        }
        const visit: Visit = {
          applicationReference: 'aaa-bbb-ccc',
          reference: 'ab-cd-ef-gh',
          prisonerId: visitSessionData.prisoner.offenderNo,
          prisonId: 'HEI',
          sessionTemplateReference: 'v9d.7ed.7u',
          visitRoom: visitSessionData.visitSlot.visitRoom,
          visitType: 'SOCIAL',
          visitStatus: 'RESERVED',
          visitRestriction: 'OPEN',
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
          visitNotes: [],
          visitors: [
            {
              nomisPersonId: 1234,
            },
          ],
          visitorSupport: [],
          createdBy: 'user1',
          createdTimestamp: '2022-02-14T10:00:00',
          modifiedTimestamp: '2022-02-14T10:05:00',
        }

        orchestrationApiClient.reserveVisit.mockResolvedValue(visit)
        const result = await visitService.reserveVisit({ username: 'user', visitSessionData })

        expect(orchestrationApiClient.reserveVisit).toHaveBeenCalledTimes(1)
        expect(result).toEqual(visit)
      })
    })
  })

  describe('Get Visit', () => {
    describe('getFullVisitDetails', () => {
      const visitHistoryDetails = TestData.visitHistoryDetails({
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
        const expectedResult: {
          visitHistoryDetails: VisitHistoryDetails
          visitors: VisitorListItem[]
          additionalSupport: string[]
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
          additionalSupport: ['Wheelchair ramp', 'custom request'],
        }

        prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue(contacts)
        additionalSupportService.getAvailableSupportOptions.mockResolvedValue(availableSupportTypes)
        orchestrationApiClient.getVisitHistory.mockResolvedValue(visitHistoryDetails)

        const result = await visitService.getFullVisitDetails({ username: 'user', reference: 'ab-cd-ef-gh' })

        expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(1)
        expect(additionalSupportService.getAvailableSupportOptions).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitHistory).toHaveBeenCalledTimes(1)
        expect(result).toEqual(expectedResult)
      })
    })
  })
})
