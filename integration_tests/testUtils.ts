import { Page } from '@playwright/test'
import CaseLoad from '@ministryofjustice/hmpps-connect-dps-components/dist/types/CaseLoad'
import tokenVerification from './mockApis/tokenVerification'
import hmppsAuth, { type UserToken } from './mockApis/hmppsAuth'
import orchestrationApi from './mockApis/orchestration'
import { resetStubs } from './mockApis/wiremock'
import bapvUserRoles from '../server/constants/bapvUserRoles'
import stubComponents from './mockApis/componentApi'
import TestData from '../server/routes/testutils/testData'

export { resetStubs }

const DEFAULT_ROLES = [bapvUserRoles.STAFF_USER]

export const attemptHmppsAuthLogin = async (page: Page) => {
  await page.goto('/')
  page.locator('h1', { hasText: 'Sign in' })
  const url = await hmppsAuth.getSignInUrl()
  await page.goto(url)
}

export const login = async (
  page: Page,
  {
    name,
    roles = DEFAULT_ROLES,
    active = true,
    authSource = 'nomis',
    caseLoad = TestData.caseLoad(),
  }: UserToken & { active?: boolean; caseLoad?: CaseLoad } = {},
) => {
  const fallbackPrison = TestData.prisonDto({
    code: caseLoad.caseLoadId,
    prisonName: caseLoad.description,
  })

  // Integration-test session bootstrap note:
  // The app populates req.session.selectedEstablishment during login flow via
  // populateSelectedEstablishment middleware. Some routes read
  // selectedEstablishment.isEnabledForPublic immediately, so if a spec forgets to
  // stub prison bootstrap endpoints the session can be missing and crash with
  // "Cannot read properties of undefined (reading 'isEnabledForPublic')".
  //
  // These fallback stubs guarantee bootstrap data exists for the active case load.
  // They intentionally use lower-priority WireMock mappings so any explicit
  // per-spec stubs (default priority) still take precedence.
  await Promise.all([
    // Ensure selected establishment can be populated even when a spec forgets to stub prison bootstrap endpoints.
    // Use low-priority mappings so explicit per-test stubs continue to take precedence.
    orchestrationApi.stubSupportedPrisonIds({ prisonIds: [caseLoad.caseLoadId], priority: 10 }),
    orchestrationApi.stubGetPrison(fallbackPrison, { priority: 10 }),
    hmppsAuth.favicon(),
    hmppsAuth.stubSignInPage(),
    hmppsAuth.stubSignOutPage(),
    hmppsAuth.token({ name, roles, authSource }),
    tokenVerification.stubVerifyToken(active),
    stubComponents({ name, caseLoad }),
  ])
  await attemptHmppsAuthLogin(page)
}
