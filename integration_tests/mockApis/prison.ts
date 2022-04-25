import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetBookings: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/api/bookings/v2/?prisonId=HEI&offenderNo=*&legalInfo=true',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
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
              offenderNo: 'AB1234C',
            },
          ],
        },
      },
    })
  },
  stubGetPrisonerDetail: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/api/offenders/*',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          bookingNo: '1234',
          bookingId: '1234',
          agencyId: 'BMI',
          firstName: 'DOUGAL',
          middleName: 'JP',
          lastName: 'MCGUIRE',
          dateOfBirth: '1950-05-28',
        },
      },
    })
  },
  stubGetPrisonerRestrictions: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/api/offenders/*/offender-restrictions?activeRestrictionsOnly=true',
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
  stubGetVisitBalances: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/api/bookings/offenderNo/*/visit/balances',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          latestIepAdjustDate: '2022-04-25T09:35:34.489Z',
          latestPrivIepAdjustDate: '2022-04-25T09:35:34.489Z',
          remainingPvo: 1,
          remainingVo: 2,
        },
      },
    })
  },
}
