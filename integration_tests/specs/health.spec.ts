import { expect, test } from '@playwright/test'
import hmppsAuth from '../mockApis/hmppsAuth'
import orchestrationApi from '../mockApis/orchestration'
import prisonerContactRegistryApi from '../mockApis/prisonerContactRegistry'
import prisonerSearchApi from '../mockApis/prisonerSearch'
import tokenVerification from '../mockApis/tokenVerification'

import { resetStubs } from '../testUtils'

test.describe('Health', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test.describe('All healthy', () => {
    test.beforeEach(async () => {
      await Promise.all([
        hmppsAuth.stubPing(),
        // TODO simplify the names of these ping stubs to remove duplication when Cypress removed
        orchestrationApi.stubOrchestrationPing(),
        prisonerContactRegistryApi.stubPrisonerContactRegistryPing(),
        prisonerSearchApi.stubPrisonerSearchPing(),
        tokenVerification.stubTokenVerificationPing(),
      ])
    })

    test('Health check is accessible and status is UP', async ({ page }) => {
      const response = await page.request.get('/health')
      const payload = await response.json()
      expect(payload.status).toBe('UP')
    })

    test('Ping is accessible and status is UP', async ({ page }) => {
      const response = await page.request.get('/ping')
      const payload = await response.json()
      expect(payload.status).toBe('UP')
    })

    test('Info is accessible and should contain activeAgencies', async ({ page }) => {
      await Promise.all([hmppsAuth.token({}), orchestrationApi.stubSupportedPrisonIds()])

      const response = await page.request.get('/info')
      const payload = await response.json()
      expect(payload.build.name).toBe('book-a-prison-visit-staff-ui')
      expect(payload.activeAgencies).toStrictEqual(['HEI', 'BLI'])
    })

    test('Info returns 503 Service unavailable if there is an error getting activeAgencies', async ({ page }) => {
      await Promise.all([hmppsAuth.token({}), orchestrationApi.stubSupportedPrisonIdsError()])

      const response = await page.request.get('/info')
      expect(response.status()).toBe(503)
    })
  })

  test.describe('Some unhealthy', () => {
    test.beforeEach(async () => {
      await Promise.all([
        hmppsAuth.stubPing(),
        orchestrationApi.stubOrchestrationPing(),
        prisonerContactRegistryApi.stubPrisonerContactRegistryPing(),
        prisonerSearchApi.stubPrisonerSearchPing(),
        tokenVerification.stubTokenVerificationPing(500),
      ])
    })

    test('Health check status is down', async ({ page }) => {
      const response = await page.request.get('/health')
      const payload = await response.json()
      expect(payload.status).toBe('DOWN')
      expect(payload.components.hmppsAuth.status).toBe('UP')
      expect(payload.components.tokenVerification.status).toBe('DOWN')
      expect(payload.components.tokenVerification.details.status).toBe(500)
      expect(payload.components.tokenVerification.details.attempts).toBe(3)
    })
  })
})
