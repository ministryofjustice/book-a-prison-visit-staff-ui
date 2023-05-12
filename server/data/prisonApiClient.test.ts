import nock from 'nock'
import config from '../config'
import PrisonApiClient from './prisonApiClient'
import { OffenderRestrictions } from './prisonApiTypes'
import TestData from '../routes/testutils/testData'

describe('prisonApiClient', () => {
  let fakePrisonApi: nock.Scope
  let prisonApiClient: PrisonApiClient
  const token = 'token-1'

  beforeEach(() => {
    fakePrisonApi = nock(config.apis.prison.url)
    prisonApiClient = new PrisonApiClient(token)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getOffenderRestrictions', () => {
    it('should return offender restrictions from the Prison API', async () => {
      const offenderNo = 'A1234BC'
      const results: OffenderRestrictions = {
        bookingId: 0,
        offenderRestrictions: [
          {
            restrictionId: 0,
            comment: 'string',
            restrictionType: 'string',
            restrictionTypeDescription: 'string',
            startDate: '2022-03-15',
            expiryDate: '2022-03-15',
            active: true,
          },
        ],
      }

      fakePrisonApi
        .get(`/api/offenders/${offenderNo}/offender-restrictions`)
        .query({
          activeRestrictionsOnly: 'true',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await prisonApiClient.getOffenderRestrictions(offenderNo)

      expect(output).toEqual(results)
    })
  })

  describe('getUserCaseLoads', () => {
    it('should return available caseloads for current user', async () => {
      const results = TestData.caseLoads()

      fakePrisonApi.get('/api/users/me/caseLoads').matchHeader('authorization', `Bearer ${token}`).reply(200, results)

      const output = await prisonApiClient.getUserCaseLoads()

      expect(output).toEqual(results)
    })
  })

  describe('setActiveCaseLoad', () => {
    it('should set active case load for current user', async () => {
      const caseLoadId = 'HEI'

      fakePrisonApi
        .put('/api/users/me/activeCaseLoad', { caseLoadId })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, {})

      const output = await prisonApiClient.setActiveCaseLoad('HEI')

      expect(output).toEqual({})
    })
  })
})
