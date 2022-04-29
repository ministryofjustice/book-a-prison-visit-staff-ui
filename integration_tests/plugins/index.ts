import { resetStubs } from '../mockApis/wiremock'

import auth from '../mockApis/auth'
import tokenVerification from '../mockApis/tokenVerification'
import prisonerContactRegistry from '../mockApis/prisonerContactRegistry'
import whereaboutsOffenderEvents from '../mockApis/whereabouts'
import prisonApi from '../mockApis/prison'
import offenderSearch from '../mockApis/offenderSearch'
import visitScheduler from '../mockApis/visitScheduler'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'
import { InmateDetail, VisitBalances } from '../../server/data/prisonApiTypes'

export default (on: (string, Record) => void): void => {
  on('task', {
    reset: resetStubs,

    getSignInUrl: auth.getSignInUrl,
    stubSignIn: auth.stubSignIn,

    stubAuthUser: auth.stubUser,
    stubAuthPing: auth.stubPing,

    stubTokenVerificationPing: tokenVerification.stubPing,

    stubGetPrisonerSocialContacts: (offenderNo: string) =>
      prisonerContactRegistry.getPrisonerSocialContacts(offenderNo),

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

    stubGetBookings: (offenderNo: string) => prisonApi.getBookings(offenderNo),
    stubGetOffender: (prisoner: Partial<InmateDetail>) => prisonApi.getOffender(prisoner),
    stubGetOffenderRestrictions: (offenderNo: string) => prisonApi.getOffenderRestrictions(offenderNo),
    stubGetVisitBalances: ({ offenderNo, visitBalances }: { offenderNo: string; visitBalances: VisitBalances }) =>
      prisonApi.getVisitBalances({ offenderNo, visitBalances }),

    stubGetPrisoners: (results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] }) =>
      offenderSearch.getPrisoners(results),
    stubGetPrisoner: (results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] }) =>
      offenderSearch.getPrisoner(results),

    stubGetAvailableSupportOptions: visitScheduler.stubGetAvailableSupportOptions,
    stubGetVisit: (reference: string) => visitScheduler.stubGetVisit(reference),
    stubGetUpcomingVisits: (offenderNo: string) => visitScheduler.getUpcomingVisits(offenderNo),
    stubGetPastVisits: (offenderNo: string) => visitScheduler.getPastVisits(offenderNo),
    stubGetVisitSessions: visitScheduler.stubGetVisitSessions,
    stubCreateVisit: visitScheduler.stubCreateVisit,
    stubUpdateVisit: visitScheduler.stubUpdateVisit,
  })
}
