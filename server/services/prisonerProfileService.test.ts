import PrisonerProfileService from './prisonerProfileService'
import PrisonApiClient from '../data/prisonApiClient'
import { InmateDetail, VisitBalances } from '../data/prisonApiTypes'

jest.mock('../data/prisonApiClient')

const offenderNo = 'A1234BC'
const prisonApiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>

describe('Prisoner profile service', () => {
  let prisonApiClientBuilder
  let prisonerProfileService: PrisonerProfileService
  let systemToken

  describe('getProfile', () => {
    beforeEach(() => {
      systemToken = async (user: string): Promise<string> => `${user}-token-1`
      prisonApiClientBuilder = jest.fn().mockReturnValue(prisonApiClient)
      prisonerProfileService = new PrisonerProfileService(prisonApiClientBuilder, systemToken)
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('Retieves and processes data for prisoner profile with visit balances', async () => {
      const inmateDetail = <InmateDetail>{
        offenderNo: 'A1234BC',
        firstName: 'JOHN',
        lastName: 'SMITH',
        dateOfBirth: '1980-10-12',
        activeAlertCount: 1,
        inactiveAlertCount: 3,
        legalStatus: 'SENTENCED',
      }

      const visitBalances: VisitBalances = {
        remainingVo: 1,
        remainingPvo: 2,
        latestIepAdjustDate: '2021-04-21',
        latestPrivIepAdjustDate: '2021-12-01',
      }

      prisonApiClient.getOffender.mockResolvedValue(inmateDetail)
      prisonApiClient.getVisitBalances.mockResolvedValue(visitBalances)

      const results = await prisonerProfileService.getProfile(offenderNo, 'user')

      expect(results).toEqual({
        displayName: 'Smith, John',
        displayDob: '12 October 1980',
        inmateDetail,
        visitBalances,
      })
    })
  })
})
