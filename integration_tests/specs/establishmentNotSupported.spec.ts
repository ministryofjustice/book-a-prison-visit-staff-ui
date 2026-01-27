import { test } from '@playwright/test'
import auth from '../mockApis/auth'
import { resetStubs } from '../testUtils'
import orchestrationApi from '../mockApis/orchestration'
import EstablishmentNotSupportedPage from '../pages-playwright/establishmentNotSupportedPage'
import HomePage from '../pages-playwright/homePage'
import SearchForAPrisonerPage from '../pages-playwright/search/searchForAPrisonerPage'
import TestData from '../../server/routes/testutils/testData'

test.describe('Establishment not supported', () => {
  test.beforeEach(async () => {
    // Reset stubs before each test
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
  })

  test('should render the establishment not supported page if user case load not supported', async ({ page }) => {
    // Sign in with unsupported case load
    const unsupportedCaseLoad = TestData.caseLoad({ caseLoadId: 'XYZ', description: 'XYZ (HMP)' })
    await auth.stubSignIn({ caseLoad: unsupportedCaseLoad })

    // Navigate to app root
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify Establishment Not Supported page
    await EstablishmentNotSupportedPage.verifyOnPage(page, 'XYZ (HMP) does not use this service')
  })

  test('should redirect to establishment not supported page if case load changes from supported to unsupported', async ({
    page,
  }) => {
    // Step 1: Sign in with supported case load
    const supportedCaseLoad = TestData.caseLoad({ caseLoadId: 'ABC', description: 'ABC (HMP)' })
    await auth.stubSignIn({ caseLoad: supportedCaseLoad })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify homepage
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.bookOrChangeVisitTile.click()

    // Navigate to search page
    const searchPage = await SearchForAPrisonerPage.verifyOnPage(page)

    // Step 2: Change active case load to unsupported
    const unsupportedCaseLoad = TestData.caseLoad({ caseLoadId: 'XYZ', description: 'XYZ (HMP)' })
    await auth.stubSignIn({ caseLoad: unsupportedCaseLoad, userToken: { roles: ['STAFF_USER'] } })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Attempt a search to trigger redirect
    await searchPage.searchInput.fill('smith')
    await searchPage.searchButton.click()

    // Verify Establishment Not Supported page
    await EstablishmentNotSupportedPage.verifyOnPage(page, 'XYZ (HMP) does not use this service')
  })
})
