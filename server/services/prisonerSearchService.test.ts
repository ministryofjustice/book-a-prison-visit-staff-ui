import PrisonerSearchService from './prisonerSearchService'
import PrisonerSearchClient from '../data/prisonerSearchClient'
import TestData from '../routes/testutils/testData'

jest.mock('../data/prisonerSearchClient')

const prisonId = 'HEI'
const search = 'some search'
const prisonerSearchClient = new PrisonerSearchClient(null) as jest.Mocked<PrisonerSearchClient>

const prisoner = TestData.prisoner()

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
          content: [prisoner],
        })

        const { results, numberOfResults, numberOfPages, next, previous } = await prisonerSearchService.getPrisoners(
          search,
          prisonId,
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

        await expect(prisonerSearchService.getPrisoners(search, prisonId, 'user', 0)).rejects.toEqual(
          new Error('some error'),
        )
      })
    })

    describe('visit search', () => {
      it('Retrieves and formats user name', async () => {
        prisonerSearchClient.getPrisoners.mockResolvedValue({
          totalPages: 1,
          totalElements: 1,
          content: [prisoner],
        })

        const { results, numberOfResults, numberOfPages, next, previous } = await prisonerSearchService.getPrisoners(
          search,
          prisonId,
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
      it('Propagates error', async () => {
        prisonerSearchClient.getPrisoners.mockRejectedValue(new Error('some error'))

        await expect(prisonerSearchService.getPrisoners(search, prisonId, 'user', 0)).rejects.toEqual(
          new Error('some error'),
        )
      })
    })
  })

  describe('getPrisoner', () => {
    it('should return null if no matching prisoner', async () => {
      prisonerSearchClient.getPrisoner.mockResolvedValue({ content: [] })
      const result = await prisonerSearchService.getPrisoner('test', prisonId, 'user')
      expect(result).toBe(null)
    })

    it('should return matching prisoner', async () => {
      prisonerSearchClient.getPrisoner.mockResolvedValue({ content: [prisoner] })
      const result = await prisonerSearchService.getPrisoner('A1234BC', prisonId, 'user')

      expect(result).toBe(prisoner)
    })
  })

  describe('getPrisonerById', () => {
    it('should return prisoner details for given prisoner ID', async () => {
      prisonerSearchClient.getPrisonerById.mockResolvedValue(prisoner)
      const result = await prisonerSearchService.getPrisonerById('A1234BC', 'user')

      expect(result).toBe(prisoner)
    })
  })
})
