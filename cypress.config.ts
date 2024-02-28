import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'

import auth from './integration_tests/mockApis/auth'
import frontendComponents from './integration_tests/mockApis/frontendComponents'
import manageUsersApi from './integration_tests/mockApis/manageUsersApi'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import nomisUserRoles from './integration_tests/mockApis/nomisUserRoles'
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
  taskTimeout: 60000,
  viewportWidth: 1280,
  viewportHeight: 1400,
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        reset: resetStubs,
        ...auth,
        ...manageUsersApi,
        ...tokenVerification,

        ...frontendComponents,
        ...nomisUserRoles,
        ...orchestrationService,
        ...prisonerContactRegistry,
        ...prisonApi,
        ...prisonerSearch,
        ...prisonRegister,
        ...whereaboutsOffenderEvents,

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
