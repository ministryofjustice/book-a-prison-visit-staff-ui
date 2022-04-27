import { resetStubs } from '../mockApis/wiremock'

import auth from '../mockApis/auth'
import tokenVerification from '../mockApis/tokenVerification'
import prisonerContactRegistry from '../mockApis/prisonerContactRegistry'
import whereaboutsOffenderEvents from '../mockApis/whereabouts'
import prisonApi from '../mockApis/prison'
import offenderSearch from '../mockApis/offenderSearch'
import visitScheduler from '../mockApis/visitScheduler'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'

export default (on: (string, Record) => void): void => {
  on('task', {
    reset: resetStubs,

    getSignInUrl: auth.getSignInUrl,
    stubSignIn: auth.stubSignIn,

    stubAuthUser: auth.stubUser,
    stubAuthPing: auth.stubPing,

    stubTokenVerificationPing: tokenVerification.stubPing,

    stubGetPrisonerContacts: prisonerContactRegistry.stubGetPrisonerContacts,

    stubGetOffenderEvents: ({
      offenderNo,
      fromDate,
      toDate,
    }: {
      offenderNo: string
      fromDate: string
      toDate: string
    }) =>
      whereaboutsOffenderEvents.stubGetOffenderEvents({
        offenderNo,
        fromDate,
        toDate,
      }),

    stubGetBookings: (offenderNo: string) => prisonApi.stubGetBookings(offenderNo),
    stubGetPrisonerDetail: (offenderNo: string) => prisonApi.stubGetPrisonerDetail(offenderNo),
    stubGetPrisonerRestrictions: (offenderNo: string) => prisonApi.stubGetPrisonerRestrictions(offenderNo),
    stubGetVisitBalances: (offenderNo: string) => prisonApi.stubGetVisitBalances(offenderNo),

    stubGetPrisoners: (results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] }) =>
      offenderSearch.getPrisoners(results),
    stubGetPrisoner: (results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] }) =>
      offenderSearch.getPrisoner(results),

    stubGetAvailableSupportOptions: visitScheduler.stubGetAvailableSupportOptions,
    stubGetVisit: (reference: string) => visitScheduler.stubGetVisit(reference),
    stubGetUpcomingVisits: ({ offenderNo, startTimestamp }: { offenderNo: string; startTimestamp: string }) =>
      visitScheduler.stubGetUpcomingVisits({
        offenderNo,
        startTimestamp,
      }),
    stubGetPastVisits: ({ offenderNo, endTimestamp }: { offenderNo: string; endTimestamp: string }) =>
      visitScheduler.stubGetPastVisits({
        offenderNo,
        endTimestamp,
      }),
    stubGetVisitSessions: visitScheduler.stubGetVisitSessions,
    stubCreateVisit: visitScheduler.stubCreateVisit,
    stubUpdateVisit: visitScheduler.stubUpdateVisit,
  })
}
