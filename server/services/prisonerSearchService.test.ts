import PrisonerSearchService from './prisonerSearchService'
import PrisonerSearchClient from '../data/prisonerSearchClient'

jest.mock('../data/prisonerSearchClient')

const search = 'some search'

describe('Prisoner search service', () => {
  let prisonerSearchClient: jest.Mocked<PrisonerSearchClient>
  let prisonerSearchService: PrisonerSearchService

  describe('getPrisoners', () => {
    beforeEach(() => {
      prisonerSearchClient = new PrisonerSearchClient(null) as jest.Mocked<PrisonerSearchClient>
      prisonerSearchService = new PrisonerSearchService(prisonerSearchClient)
    })
    it('Retrieves and formats user name', async () => {
      prisonerSearchClient.getPrisoners.mockResolvedValue([
        {
          firstName: 'john',
          lastName: 'smith',
          prisonerNumber: 'A1234BC',
          dateOfBirth: '1975-04-02',
          bookingId: '12345',
        },
      ])

      const results = await prisonerSearchService.getPrisoners(search)

      expect(results).toEqual([
        {
          name: 'Smith, John',
          prisonerNumber: 'A1234BC',
          dateOfBirth: '2 April 1975',
          bookingId: '12345',
        },
      ])
    })
    it('Propagates error', async () => {
      prisonerSearchClient.getPrisoners.mockRejectedValue(new Error('some error'))

      await expect(prisonerSearchService.getPrisoners(search)).rejects.toEqual(new Error('some error'))
    })
  })
})
