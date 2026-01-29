import { Page } from '@playwright/test'
import CaseLoad from '@ministryofjustice/hmpps-connect-dps-components/dist/types/CaseLoad'
import tokenVerification from './mockApis/tokenVerification'
import hmppsAuth, { type UserToken } from './mockApis/hmppsAuth'
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
  await Promise.all([
    hmppsAuth.favicon(),
    hmppsAuth.stubSignInPage(),
    hmppsAuth.stubSignOutPage(),
    hmppsAuth.token({ name, roles, authSource }),
    tokenVerification.stubVerifyToken(active),
    stubComponents({ username: name, caseLoad }),
  ])
  await attemptHmppsAuthLogin(page)
}
