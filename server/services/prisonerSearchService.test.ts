import PrisonerSearchService from './prisonerSearchService'
import PrisonerSearchClient from '../data/prisonerSearchClient'

jest.mock('../data/prisonerSearchClient')

const search = 'some search'
const prisonerSearchClient = new PrisonerSearchClient(null) as jest.Mocked<PrisonerSearchClient>

describe('Prisoner search service', () => {
  let prisonerSearchClientBuilder
  let prisonerSearchService: PrisonerSearchService

  describe('getPrisoners', () => {
    beforeEach(() => {
      prisonerSearchClientBuilder = jest.fn().mockReturnValue(prisonerSearchClient)
      prisonerSearchService = new PrisonerSearchService(prisonerSearchClientBuilder)
    })

    afterEach(() => {
      jest.resetAllMocks()
    })
    it('Retrieves and formats user name', async () => {
      prisonerSearchClient.getPrisoners.mockResolvedValue({
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

      const results = await prisonerSearchService.getPrisoners(search, 'user')

      expect(results).toEqual([
        [
          {
            text: 'Smith, John',
          },
          {
            text: 'A1234BC',
          },
          {
            text: '2 April 1975',
          },
        ],
      ])
    })
    it('Propagates error', async () => {
      prisonerSearchClient.getPrisoners.mockRejectedValue(new Error('some error'))

      await expect(prisonerSearchService.getPrisoners(search, 'user')).rejects.toEqual(new Error('some error'))
    })
  })
})
