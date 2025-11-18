import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import BookerService from './bookerService'
import { BookerSearchResultsDto } from '../data/orchestrationApiTypes'

const token = 'some token'
const username = 'user1'

describe('Booker service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let bookerService: BookerService

  const OrchestrationApiClientFactory = jest.fn()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)

    bookerService = new BookerService(OrchestrationApiClientFactory, hmppsAuthClient)
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getSortedBookersByEmail', () => {
    it('should return booker(s) for given email address sorted by created date descending', async () => {
      const email = 'booker@example.com'
      const activeBookerAccount = TestData.bookerSearchResult({
        reference: 'active-booker',
        createdTimestamp: '2025-10-09T12:00:00',
      })
      const bookerWithEarlierCreatedDate = TestData.bookerSearchResult({
        reference: 'old-booker-account',
        createdTimestamp: '2024-10-09T12:00:00',
      })

      orchestrationApiClient.getBookersByEmail.mockResolvedValue([bookerWithEarlierCreatedDate, activeBookerAccount])

      const result = await bookerService.getSortedBookersByEmail({ username, email })

      expect(result).toStrictEqual([activeBookerAccount, bookerWithEarlierCreatedDate])
      expect(orchestrationApiClient.getBookersByEmail).toHaveBeenCalledWith(email)
    })
  })

  describe('getBookerDetails', () => {
    it('should return booker details for given booker reference', async () => {
      const booker = TestData.bookerDetailedInfo()
      const { reference } = booker

      orchestrationApiClient.getBookerDetails.mockResolvedValue(booker)

      const result = await bookerService.getBookerDetails({ username, reference })

      expect(result).toStrictEqual(booker)
      expect(orchestrationApiClient.getBookerDetails).toHaveBeenCalledWith(reference)
    })
  })

  describe('getNonLinkedSocialContacts', () => {
    it('should return all non-linked social contacts for given prisoner number and booker reference', async () => {
      const booker = TestData.bookerDetailedInfo()
      const { reference } = booker
      const prisonerId = booker.permittedPrisoners[0].prisoner.prisonerNumber
      const socialContacts = [TestData.socialContact()]

      orchestrationApiClient.getNonLinkedSocialContacts.mockResolvedValue(socialContacts)

      const result = await bookerService.getNonLinkedSocialContacts({ username, reference, prisonerId })

      expect(result).toStrictEqual(socialContacts)
      expect(orchestrationApiClient.getNonLinkedSocialContacts).toHaveBeenCalledWith({ reference, prisonerId })
    })
  })

  describe('getBookerStatus', () => {
    const email = 'booker@example.com'
    const activeBooker = TestData.bookerSearchResult({ reference: 'a' })
    const inactiveBooker = TestData.bookerSearchResult({ reference: 'b' })

    it.each([
      ['single booker account', [activeBooker], 'a', true, false],
      ['multiple booker accounts - active requested', [activeBooker, inactiveBooker], 'a', true, true],
      ['multiple booker accounts - inactive requested', [activeBooker, inactiveBooker], 'b', false, true],
      ['booker not found', [activeBooker], 'x', false, false],
      ['no bookers', [], 'x', false, false],
    ])(
      'should handle %s',
      async (
        _: string,
        bookers: BookerSearchResultsDto[],
        reference: string,
        expectedActive: boolean,
        expectedMultipleAccounts: boolean,
      ) => {
        orchestrationApiClient.getBookersByEmail.mockResolvedValue(bookers)

        const result = await bookerService.getBookerStatus({ username: 'user1', email, reference })

        expect(result).toStrictEqual({ active: expectedActive, emailHasMultipleAccounts: expectedMultipleAccounts })
        expect(orchestrationApiClient.getBookersByEmail).toHaveBeenCalledWith(email)
      },
    )
  })

  describe('unlinkBookerVisitor', () => {
    it('should unlink visitor from booker account', async () => {
      const reference = 'aaa-bbb-ccc'
      const prisonerId = 'A1234BC'
      const visitorId = 123

      orchestrationApiClient.unlinkBookerVisitor.mockResolvedValue()

      await bookerService.unlinkBookerVisitor({ username: 'user1', reference, prisonerId, visitorId })

      expect(orchestrationApiClient.unlinkBookerVisitor).toHaveBeenCalledWith({ reference, prisonerId, visitorId })
    })
  })
})
