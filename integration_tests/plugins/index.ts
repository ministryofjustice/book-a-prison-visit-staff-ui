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
import { Visit } from '../../server/data/visitSchedulerApiTypes'

export default (on: (string, Record) => void): void => {
  on('task', {
    reset: resetStubs,
    ...auth,
    ...tokenVerification,

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
    stubGetUpcomingVisits: ({ offenderNo, upcomingVisits }: { offenderNo: string; upcomingVisits: Visit[] }) =>
      visitScheduler.getUpcomingVisits({ offenderNo, upcomingVisits }),
    stubGetPastVisits: ({ offenderNo, pastVisits }: { offenderNo: string; pastVisits: Visit[] }) =>
      visitScheduler.getPastVisits({ offenderNo, pastVisits }),
    stubGetVisitSessions: visitScheduler.stubGetVisitSessions,
    stubCreateVisit: visitScheduler.stubCreateVisit,
    stubUpdateVisit: visitScheduler.stubUpdateVisit,
  })
}
