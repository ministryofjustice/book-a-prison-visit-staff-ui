import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { InmateDetail, VisitBalances } from '../../server/data/prisonApiTypes'

export default {
  getBookings: (offenderNo: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/bookings/v2?prisonId=HEI&offenderNo=${offenderNo}&legalInfo=true`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
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
  getOffender: (prisoner: Partial<InmateDetail>): SuperAgentRequest => {
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
  getOffenderRestrictions: (offenderNo: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prison/api/offenders/${offenderNo}/offender-restrictions?activeRestrictionsOnly=true`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          bookingId: '1234',
          offenderRestrictions: [
            {
              active: true,
              comment: 'restriction comment',
              expiryDate: '2022-04-25T09:35:34.489Z',
              restrictionId: 123,
              restrictionType: 'RESTRICTED',
              restrictionTypeDescription: 'Restricted',
              startDate: '2022-04-25T09:35:34.489Z',
            },
          ],
        },
      },
    })
  },
  getVisitBalances: ({
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
