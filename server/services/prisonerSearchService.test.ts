import PrisonerSearchService from './prisonerSearchService'
import PrisonerSearchClient from '../data/prisonerSearchClient'

jest.mock('../data/prisonerSearchClient')

const search = 'some search'
const prisonerSearchClient = new PrisonerSearchClient(null) as jest.Mocked<PrisonerSearchClient>

describe('Prisoner search service', () => {
  let prisonerSearchClientBuilder
  let prisonerSearchService: PrisonerSearchService
  let systemToken

  describe('getPrisoners', () => {
    beforeEach(() => {
      systemToken = async (user: string): Promise<string> => `${user}-token-1`
      prisonerSearchClientBuilder = jest.fn().mockReturnValue(prisonerSearchClient)
      prisonerSearchService = new PrisonerSearchService(prisonerSearchClientBuilder, systemToken)
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    describe('prisoner search', () => {
      it('Retrieves and formats user name', async () => {
        prisonerSearchClient.getPrisoners.mockResolvedValue({
          totalPages: 1,
          totalElements: 1,
          content: [
            {
              firstName: 'john',
              lastName: 'smith',
              prisonerNumber: 'A1234BC',
              dateOfBirth: '1975-04-02',
              bookingId: '12345',
              restrictedPatient: false,
            },
          ],
        })

        const { results, numberOfResults, numberOfPages, next, previous } = await prisonerSearchService.getPrisoners(
          search,
          'user',
          0
        )

        expect(results).toEqual([
          [
            {
              html: '<a href="/prisoner/A1234BC">Smith, John</a>',
            },
            {
              html: 'A1234BC',
            },
            {
              html: '2 April 1975',
            },
          ],
        ])
        expect(numberOfResults).toEqual(1)
        expect(numberOfPages).toEqual(1)
        expect(next).toEqual(1)
        expect(previous).toEqual(1)
      })
      it('Propagates error', async () => {
        prisonerSearchClient.getPrisoners.mockRejectedValue(new Error('some error'))

        await expect(prisonerSearchService.getPrisoners(search, 'user', 0)).rejects.toEqual(new Error('some error'))
      })
    })

    describe('visit search', () => {
      it('Retrieves and formats user name', async () => {
        prisonerSearchClient.getPrisoners.mockResolvedValue({
          totalPages: 1,
          totalElements: 1,
          content: [
            {
              firstName: 'john',
              lastName: 'smith',
              prisonerNumber: 'A1234BC',
              dateOfBirth: '1975-04-02',
              bookingId: '12345',
              restrictedPatient: false,
            },
          ],
        })

        const { results, numberOfResults, numberOfPages, next, previous } = await prisonerSearchService.getPrisoners(
          search,
          'user',
          0,
          true
        )

        expect(results).toEqual([
          [
            {
              html: '<a href="/prisoner/A1234BC/visits">Smith, John</a>',
            },
            {
              html: 'A1234BC',
            },
            {
              html: '2 April 1975',
            },
          ],
        ])
        expect(numberOfResults).toEqual(1)
        expect(numberOfPages).toEqual(1)
        expect(next).toEqual(1)
        expect(previous).toEqual(1)
      })
      it('Propagates error', async () => {
        prisonerSearchClient.getPrisoners.mockRejectedValue(new Error('some error'))

        await expect(prisonerSearchService.getPrisoners(search, 'user', 0)).rejects.toEqual(new Error('some error'))
      })
    })
  })
})
