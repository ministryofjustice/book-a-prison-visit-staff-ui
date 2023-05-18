import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'

import auth from './integration_tests/mockApis/auth'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import orchestrationService from './integration_tests/mockApis/orchestration'
import prisonerContactRegistry from './integration_tests/mockApis/prisonerContactRegistry'
import whereaboutsOffenderEvents from './integration_tests/mockApis/whereabouts'
import prisonApi from './integration_tests/mockApis/prison'
import prisonerSearch from './integration_tests/mockApis/prisonerSearch'
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

        // Orchestration service
        stubBookVisit: orchestrationService.stubBookVisit,
        stubCancelVisit: orchestrationService.stubCancelVisit,
        stubChangeReservedSlot: orchestrationService.stubChangeReservedSlot,
        stubReserveVisit: orchestrationService.stubReserveVisit,
        stubVisit: orchestrationService.stubVisit,
        stubVisitHistory: orchestrationService.stubVisitHistory,
        stubUpcomingVisits: orchestrationService.stubUpcomingVisits,
        stubVisitsByDate: orchestrationService.stubVisitsByDate,
        stubAvailableSupport: orchestrationService.stubAvailableSupport,
        stubVisitSessions: orchestrationService.stubVisitSessions,
        stubSessionSchedule: orchestrationService.stubSessionSchedule,
        stubVisitSessionCapacity: orchestrationService.stubVisitSessionCapacity,
        stubPrisonerProfile: orchestrationService.stubPrisonerProfile,
        stubSupportedPrisonIds: orchestrationService.stubSupportedPrisonIds,

        // Prisoner contact registry
        stubPrisonerSocialContacts: prisonerContactRegistry.stubPrisonerSocialContacts,

        // Prison API
        stubOffenderRestrictions: prisonApi.stubOffenderRestrictions,
        stubSetActiveCaseLoad: prisonApi.stubSetActiveCaseLoad,
        stubUserCaseloads: prisonApi.stubUserCaseloads,

        // Prisoner offender search
        stubPrisonerById: prisonerSearch.stubPrisonerById,
        stubPrisoners: prisonerSearch.stubPrisoners,
        stubPrisoner: prisonerSearch.stubPrisoner,
        stubGetPrisonersByPrisonerNumbers: prisonerSearch.stubGetPrisonersByPrisonerNumbers,

        // Prison register API
        stubPrisons: prisonRegister.stubPrisons,

        // Whereabouts
        stubOffenderEvents: whereaboutsOffenderEvents.stubOffenderEvents,

        // Log message to console
        log: (message: string) => {
          // eslint-disable-next-line no-console
          console.log(message)
          return null
        },

        // Log table to console
        table: (violationData: Record<string, string>[]) => {
          // eslint-disable-next-line no-console
          console.table(violationData)
          return null
        },
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/integration/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
    experimentalRunAllSpecs: true,
  },
})
