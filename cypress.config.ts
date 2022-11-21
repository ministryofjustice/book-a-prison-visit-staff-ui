import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'

import auth from './integration_tests/mockApis/auth'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import prisonerContactRegistry from './integration_tests/mockApis/prisonerContactRegistry'
import whereaboutsOffenderEvents from './integration_tests/mockApis/whereabouts'
import prisonApi from './integration_tests/mockApis/prison'
import offenderSearch from './integration_tests/mockApis/offenderSearch'
import visitScheduler from './integration_tests/mockApis/visitScheduler'
import prisonRegister from './integration_tests/mockApis/prisonRegister'

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
        stubGetPrisonerSocialContacts: prisonerContactRegistry.stubGetPrisonerSocialContacts,

        // Prison API
        stubGetBookings: prisonApi.stubGetBookings,
        stubGetOffender: prisonApi.stubGetOffender,
        stubGetOffenderRestrictions: prisonApi.stubGetOffenderRestrictions,
        stubGetVisitBalances: prisonApi.stubGetVisitBalances,

        // Prisoner offender search
        stubGetPrisoner: results => offenderSearch.stubGetPrisoner(results),
        stubGetPrisoners: ({ results, page, size }) => offenderSearch.stubGetPrisoners(results, page, size),

        // Prison register API
        stubGetPrisons: prisonRegister.stubGetPrisons,

        // Visit scheduler
        stubGetAvailableSupportOptions: visitScheduler.stubGetAvailableSupportOptions,
        stubGetVisit: visitScheduler.stubGetVisit,
        stubGetUpcomingVisits: visitScheduler.stubGetUpcomingVisits,
        stubGetPastVisits: visitScheduler.stubGetPastVisits,
        stubGetVisitSessions: visitScheduler.stubGetVisitSessions,

        // Whereabouts
        stubGetOffenderEvents: whereaboutsOffenderEvents.stubGetOffenderEvents,
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
  },
})
