import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'

import auth from './integration_tests/mockApis/auth'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import prisonerContactRegistry from './integration_tests/mockApis/prisonerContactRegistry'
import whereaboutsOffenderEvents from './integration_tests/mockApis/whereabouts'
import prisonApi from './integration_tests/mockApis/prison'
import offenderSearch from './integration_tests/mockApis/offenderSearch'
import visitScheduler from './integration_tests/mockApis/visitScheduler'
import { Prisoner } from './server/data/prisonerOffenderSearchTypes'
import { InmateDetail, VisitBalances } from './server/data/prisonApiTypes'
import { Visit } from './server/data/visitSchedulerApiTypes'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  videoUploadOnPasses: false,
  taskTimeout: 60000,
  viewportWidth: 2000,
  viewportHeight: 2000,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
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
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.spec).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
  },
})
