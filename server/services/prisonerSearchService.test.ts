import PrisonerSearchService from './prisonerSearchService'
import PrisonerSearchClient from '../data/prisonerSearchClient'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'

jest.mock('../data/prisonerSearchClient')

const search = 'some search'
const prisonerSearchClient = new PrisonerSearchClient(null) as jest.Mocked<PrisonerSearchClient>

const prisonerDto: Prisoner = {
  firstName: 'john',
  lastName: 'smith',
  prisonerNumber: 'A1234BC',
  dateOfBirth: '1975-04-02',
  bookingId: '12345',
  restrictedPatient: false,
}

describe('Prisoner search service', () => {
  let prisonerSearchClientBuilder
  let prisonerSearchService: PrisonerSearchService
  let systemToken

  beforeEach(() => {
    systemToken = async (user: string): Promise<string> => `${user}-token-1`
    prisonerSearchClientBuilder = jest.fn().mockReturnValue(prisonerSearchClient)
    prisonerSearchService = new PrisonerSearchService(prisonerSearchClientBuilder, systemToken)
  })

  describe('getPrisoners', () => {
    afterEach(() => {
      jest.resetAllMocks()
    })

    describe('prisoner search', () => {
      it('Retrieves and formats user name', async () => {
        prisonerSearchClient.getPrisoners.mockResolvedValue({
          totalPages: 1,
          totalElements: 1,
          content: [prisonerDto],
        })

        const { results, numberOfResults, numberOfPages, next, previous } = await prisonerSearchService.getPrisoners(
          search,
          'user',
          0,
        )

        expect(results).toEqual([
          [
            {
              html: '<a href="/prisoner/A1234BC?search=some+search" class="bapv-result-row">Smith, John</a>',
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
          content: [prisonerDto],
        })

        const { results, numberOfResults, numberOfPages, next, previous } = await prisonerSearchService.getPrisoners(
          search,
          'user',
          0,
          true,
        )

        expect(results).toEqual([
          [
            {
              html: '<a href="/prisoner/A1234BC/visits?search=some+search" class="bapv-result-row">Smith, John</a>',
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
      it('Remove trailing full stop when mac auto insert on search text', async () => {
        const mockGetPrisoners = prisonerSearchClient.getPrisoners.mockResolvedValue({
          totalPages: 1,
          totalElements: 1,
          content: [prisonerDto],
        })

        await prisonerSearchService.getPrisoners('Aled.  ', 'user', 1, true)
        expect(mockGetPrisoners).toHaveBeenCalledWith('Aled', 0)
      })
      it('Remove trailing full stop on search text', async () => {
        const mockGetPrisoners = prisonerSearchClient.getPrisoners.mockResolvedValue({
          totalPages: 1,
          totalElements: 1,
          content: [prisonerDto],
        })

        await prisonerSearchService.getPrisoners('Aled.', 'user', 1, true)
        expect(mockGetPrisoners).toHaveBeenCalledWith('Aled', 0)
      })
      it('Propagates error', async () => {
        prisonerSearchClient.getPrisoners.mockRejectedValue(new Error('some error'))

        await expect(prisonerSearchService.getPrisoners(search, 'user', 0)).rejects.toEqual(new Error('some error'))
      })
    })
  })

  describe('getPrisoner', () => {
    it('should return null if no matching prisoner', async () => {
      prisonerSearchClient.getPrisoner.mockResolvedValue({ content: [] })
      const result = await prisonerSearchService.getPrisoner('test', 'user')
      expect(result).toBe(null)
    })

    it('should matching prisoner', async () => {
      const prisoner: { content: Prisoner[] } = {
        content: [prisonerDto],
      }

      prisonerSearchClient.getPrisoner.mockResolvedValue(prisoner)
      const result = await prisonerSearchService.getPrisoner('A1234BC', 'user')

      expect(result).toBe(prisoner.content[0])
    })
  })

  describe('getPrisonerById', () => {
    it('should return prisoner details for given prisoner ID', async () => {
      const prisoner: Prisoner = {
        lastName: 'FORENAME',
        firstName: 'SURNAME',
        prisonerNumber: 'A1234BC',
        dateOfBirth: '2000-01-01',
        prisonId: 'HEI',
        prisonName: 'HMP Hewell',
        cellLocation: '1-1-C-028',
        restrictedPatient: false,
      }

      prisonerSearchClient.getPrisonerById.mockResolvedValue(prisoner)
      const result = await prisonerSearchService.getPrisonerById('A1234BC', 'user')

      expect(result).toBe(prisoner)
    })
  })
})
