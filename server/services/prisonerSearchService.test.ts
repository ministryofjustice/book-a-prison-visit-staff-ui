import PrisonerSearchService from './prisonerSearchService'
import PrisonerSearchClient from '../data/prisonerSearchClient'

jest.mock('../data/prisonerSearchClient')

const search = 'some search'

describe.skip('Prisoner search service', () => {
  let prisonerSearchClient: jest.Mocked<PrisonerSearchClient>
  let prisonerSearchService: PrisonerSearchService

  describe('getPrisoners', () => {
    beforeEach(() => {
      prisonerSearchClient = new PrisonerSearchClient(null) as jest.Mocked<PrisonerSearchClient>
      prisonerSearchService = new PrisonerSearchService(prisonerSearchClient)
    })
    it('Retrieves and formats user name', async () => {
      prisonerSearchClient.getPrisoners.mockResolvedValue({
        matches: [
          {
            prisoner: {
              firstName: 'john',
              lastName: 'smith',
              prisonerNumber: 'A1234BC',
              dateOfBirth: '1975-04-02',
              bookingId: '12345',
              restrictedPatient: false,
            },
          },
        ],
      })

      const results = await prisonerSearchService.getPrisoners(search)

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

      await expect(prisonerSearchService.getPrisoners(search)).rejects.toEqual(new Error('some error'))
    })
  })
})
