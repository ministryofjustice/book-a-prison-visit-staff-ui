import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import {
  InmateDetail,
  OffenderRestrictions,
  PagePrisonerBookingSummary,
  VisitBalances,
} from '../../server/data/prisonApiTypes'

export default {
  stubGetBookings: (offenderNo: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/bookings/v2?prisonId=HEI&offenderNo=${offenderNo}&legalInfo=true`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: <PagePrisonerBookingSummary>{
          numberOfElements: 1,
          content: [
            {
              age: 20,
              agencyId: 'HEI',
              bookingId: 123,
              bookingNo: '123',
              convictedStatus: 'Convicted',
              dateOfBirth: '1999-01-01',
              firstName: 'FirstName',
              lastName: 'LastName',
              offenderNo,
            },
          ],
        },
      },
    })
  },
  stubGetOffender: (prisoner: Partial<InmateDetail>): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prison/api/offenders/${prisoner.offenderNo}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisoner,
      },
    })
  },
  stubGetOffenderRestrictions: (offenderNo: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/offenders/${offenderNo}/offender-restrictions?activeRestrictionsOnly=true`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: <OffenderRestrictions>{
          bookingId: 123,
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
        },
      },
    })
  },
  stubGetVisitBalances: ({
    offenderNo,
    visitBalances,
  }: {
    offenderNo: string
    visitBalances: VisitBalances
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prison/api/bookings/offenderNo/${offenderNo}/visit/balances`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitBalances,
      },
    })
  },
}
