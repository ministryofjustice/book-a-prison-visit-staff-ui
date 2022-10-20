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
  viewportWidth: 1280,
  viewportHeight: 1400,
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        reset: resetStubs,
        ...auth,
        ...tokenVerification,

        // Prisoner Contact Registry
        stubGetPrisonerSocialContacts: prisonerContactRegistry.getPrisonerSocialContacts,

        // Prison API
        stubGetBookings: prisonApi.getBookings,
        stubGetOffender: prisonApi.getOffender,
        stubGetVisitBalances: prisonApi.getVisitBalances,

        // Prisoner offender search
        // stubGetPrisoner: results => offenderSearch.getPrisoner(results),
        stubGetPrisoners: ({ results, page, size }) => offenderSearch.getPrisoners(results, page, size),

        // Visit scheduler
        // stubGetAvailableSupportOptions: visitScheduler.stubGetAvailableSupportOptions,
        // stubGetVisit: visitScheduler.stubGetVisit,
        stubGetUpcomingVisits: visitScheduler.getUpcomingVisits,
        stubGetPastVisits: visitScheduler.getPastVisits,
        // stubGetVisitSessions: visitScheduler.stubGetVisitSessions,

        // Whereabouts
        // stubGetOffenderEvents: whereaboutsOffenderEvents.stubGetOffenderEvents,
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
  },
})
