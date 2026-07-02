import { expect, test } from '@playwright/test'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'
import TestData from '../../../server/routes/testutils/testData'
import ViewVisitAllowancesPage from '../../pages/visitAllowances/view'
import UpdateVisitAllowancesPage from '../../pages/visitAllowances/update'
import incentivesApi from '../../mockApis/incentives'

const prisonId = 'HEI'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await orchestrationApi.stubSupportedPrisonIds()
  await orchestrationApi.stubGetPrison()
  await orchestrationApi.stubGetNotificationCount({})

  await login(page)
})

test.describe('Full visit allowances journey', () => {
  test('should navigate to view visit allowances page, then update', async ({ page }) => {
    await incentivesApi.stubGetPrisonIncentiveLevels({ prisonId })
    await incentivesApi.stubGetRemandConfig({ prisonId })

    // Navigate to View visit allowances page
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.viewVisitAllowancesTile.click()
    const visitAllowancePage = await ViewVisitAllowancesPage.verifyOnPage(page)

    await expect(visitAllowancePage.getRemandLimit()).toContainText('3 visits every 7 days')
    await expect(visitAllowancePage.getWeekStartDay()).toContainText('Monday')
    await expect(visitAllowancePage.getIncentiveLevel(1)).toContainText('Standard')
    await expect(visitAllowancePage.getVoCount(1)).toContainText('1 every 14 days')
    await expect(visitAllowancePage.getPvoCount(1)).toContainText('3 every 28 days')

    // Change allowance page
    await visitAllowancePage.changeAllowance()
    const updateAllowancesPage = await UpdateVisitAllowancesPage.verifyOnPage(page)
    await updateAllowancesPage.enterRemandLimit('5')
    await updateAllowancesPage.selectDay('Sunday')

    await incentivesApi.stubUpdateRemandConfig({
      visitSchedulerUpdatePrisonDto: TestData.prisonRemandConfig({
        weekStartDay: 'SUNDAY',
        remandVisitLimitPerWeek: 5,
      }),
    })
    await incentivesApi.stubGetRemandConfig({
      prisonId,
      remandConfig: TestData.prisonRemandConfig({ remandVisitLimitPerWeek: 5, weekStartDay: 'SUNDAY' }),
    })

    await updateAllowancesPage.submitForm()

    await ViewVisitAllowancesPage.verifyOnPage(page)
    await expect(visitAllowancePage.messages.first()).toContainText(
      '5 visits every 7 days. This allowance renews on Sunday',
    )
    await expect(visitAllowancePage.getRemandLimit()).toContainText('5 visits every 7 days')
    await expect(visitAllowancePage.getWeekStartDay()).toContainText('Sunday')
  })
})
