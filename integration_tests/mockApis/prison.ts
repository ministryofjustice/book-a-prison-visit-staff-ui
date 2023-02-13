import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import {
  InmateDetail,
  OffenderRestriction,
  OffenderRestrictions,
  PagePrisonerBookingSummary,
  PrisonerBookingSummary,
  VisitBalances,
} from '../../server/data/prisonApiTypes'

export default {
  stubBookings: (prisoner: PrisonerBookingSummary): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/bookings/v2?prisonId=${prisoner.agencyId}&offenderNo=${prisoner.offenderNo}&legalInfo=true`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: <PagePrisonerBookingSummary>{
          numberOfElements: 1,
          content: [prisoner],
        },
      },
    })
  },
  stubOffender: (prisoner: InmateDetail): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/offenders/${prisoner.offenderNo}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisoner,
      },
    })
  },
  stubOffenderRestrictions: ({
    offenderNo,
    offenderRestrictions = [],
  }: {
    offenderNo: string
    offenderRestrictions: OffenderRestriction[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/offenders/${offenderNo}/offender-restrictions?activeRestrictionsOnly=true`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: <OffenderRestrictions>{
          bookingId: 12345,
          offenderRestrictions,
        },
      },
    })
  },
  stubVisitBalances: ({
    offenderNo,
    visitBalances,
  }: {
    offenderNo: string
    visitBalances: VisitBalances
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/bookings/offenderNo/${offenderNo}/visit/balances`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitBalances,
      },
    })
  },
}
