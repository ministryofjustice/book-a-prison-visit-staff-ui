import { test } from '@playwright/test'
import { login, resetStubs } from '../testUtils'
import orchestrationApi from '../mockApis/orchestration'
import EstablishmentNotSupportedPage from '../pages-playwright/establishmentNotSupportedPage'
import HomePage from '../pages-playwright/homePage'
import TestData from '../../server/routes/testutils/testData'
import SearchForAPrisonerPage from '../pages-playwright/search/searchForAPrisonerPage'
import stubComponents from '../mockApis/componentApi'

test.describe('Establishment not supported', () => {
  test.beforeEach(async () => {
    await resetStubs()
  })

  test('should render the establishment not supported page if user case load not supported', async ({ page }) => {
    // Sign in with unsupported case load
    const unsupportedCaseLoad = TestData.caseLoad({ caseLoadId: 'XYZ', description: 'XYZ (HMP)' })
    await orchestrationApi.stubSupportedPrisonIds()

    await login(page, { caseLoad: unsupportedCaseLoad })

    await EstablishmentNotSupportedPage.verifyOnPage(page, unsupportedCaseLoad.description)
  })

  test('should redirect to establishment not supported page if case load changes from supported to unsupported', async ({
    page,
  }) => {
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
    await login(page)

    // Start on homepage - with user having a supported case load
    const homePage = await HomePage.verifyOnPage(page)

    // Start booking journey
    await homePage.bookOrChangeVisitTile.click()
    const searchForAPrisonerPage = await SearchForAPrisonerPage.verifyOnPage(page)

    // User's active case load changes
    const unsupportedCaseLoad = TestData.caseLoad({ caseLoadId: 'XYZ', description: 'XYZ (HMP)' })
    await stubComponents({ caseLoad: unsupportedCaseLoad })
    // await login(page, { caseLoad: unsupportedCaseLoad })

    // Attempt to search for a prisoner
    await searchForAPrisonerPage.searchInput.fill('smith')
    await searchForAPrisonerPage.searchButton.click()

    // Redirected to establishment not supported page
    await EstablishmentNotSupportedPage.verifyOnPage(page, unsupportedCaseLoad.description)
  })
})
