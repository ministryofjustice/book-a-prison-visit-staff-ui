import nock from 'nock'
import config from '../config'
import PrisonApiClient, { prisonApiClientBuilder } from './prisonApiClient'
import { InmateDetail, OffenderRestrictions, PagePrisonerBookingSummary, VisitBalances } from './prisonApiTypes'

describe('prisonApiClient', () => {
  let fakePrisonApi: nock.Scope
  let client: PrisonApiClient
  const token = 'token-1'

  beforeEach(() => {
    fakePrisonApi = nock(config.apis.prison.url)
    client = prisonApiClientBuilder(token)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getBookings', () => {
    it('should return PagePrisonerBookingSummary from the Prison API', async () => {
      const offenderNo = 'A1234BC'
      const prisonId = 'HEI'
      const results = {
        content: [
          {
            bookingId: 12345,
            bookingNo: 'A123445',
            offenderNo: 'A1234BC',
            firstName: 'JOHN',
            lastName: 'SMITH',
            dateOfBirth: '1980-10-12',
            agencyId: 'HEI',
            legalStatus: 'SENTENCED',
            convictedStatus: 'Convicted',
          },
        ],
        numberOfElements: 1,
      } as PagePrisonerBookingSummary

      fakePrisonApi
        .get('/api/bookings/v2')
        .query({
          prisonId,
          offenderNo,
          legalInfo: 'true',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getBookings(offenderNo, prisonId)

      expect(output).toEqual(results)
    })
  })

  describe('getOffender', () => {
    it('should return inmateDetail from the Prison API', async () => {
      const offenderNo = 'A1234BC'
      const results = {
        offenderNo: 'A1234BC',
        firstName: 'JOHN',
        lastName: 'SMITH',
        dateOfBirth: '1980-10-12',
        activeAlertCount: 1,
        inactiveAlertCount: 3,
        assignedLivingUnit: {
          description: '1-1-C-028',
          agencyName: 'Hewell (HMP)',
        },
        legalStatus: 'SENTENCED',
        privilegeSummary: {
          iepLevel: 'Basic',
        },
      } as InmateDetail

      fakePrisonApi
        .get(`/api/offenders/${offenderNo}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getOffender(offenderNo)

      expect(output).toEqual(results)
    })
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

      const output = await client.getOffenderRestrictions(offenderNo)

      expect(output).toEqual(results)
    })
  })

  describe('getVisitBalances', () => {
    it('should return visitBalances for a SENTENCED prisoner', async () => {
      const offenderNo = 'A1234BC'
      const results: VisitBalances = {
        remainingVo: 1,
        remainingPvo: 2,
        latestIepAdjustDate: '2021-04-21',
        latestPrivIepAdjustDate: '2021-12-01',
      }

      fakePrisonApi
        .get(`/api/bookings/offenderNo/${offenderNo}/visit/balances`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getVisitBalances(offenderNo)

      expect(output).toEqual(results)
    })

    it('should return null (404 from the API) for a prisoner on REMAND', async () => {
      const offenderNo = 'B1234CD'

      fakePrisonApi
        .get(`/api/bookings/offenderNo/${offenderNo}/visit/balances`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(404)

      const output = await client.getVisitBalances(offenderNo)

      expect(output).toBeNull()
    })

    it('should throw API errors other than 404', async () => {
      const offenderNo = '//B1234CD'

      fakePrisonApi
        .get(`/api/bookings/offenderNo/${offenderNo}/visit/balances`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(400)

      expect.assertions(1)
      try {
        await client.getVisitBalances(offenderNo)
      } catch (error) {
        expect(error.message).toMatch(/Bad Request/)
      }
    })
  })
})
