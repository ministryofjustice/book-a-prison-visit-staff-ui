import { expect, test } from '@playwright/test'
import orchestrationApi from '../../../mockApis/orchestration'
import { login, resetStubs } from '../../../testUtils'
import TestData from '../../../../server/routes/testutils/testData'
import PrisonerProfilePage from '../../../pages-playwright/prisoner/prisonerProfilePage'
import VisitOrdersHistoryPage from '../../../pages-playwright/prisoner/visitOrders/visitOrdersHistoryPage'

test.describe('Visiting orders history', () => {
  const profile = TestData.prisonerProfile()
  const { prisonerId } = profile

  test.beforeEach(async ({ page }) => {
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount()
    await orchestrationApi.stubGetVisitorRequests()

    await orchestrationApi.stubPrisonerProfile(profile)

    await login(page)
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should navigate to visiting orders history page from prisoner profile', async ({ page }) => {
    // Go to prisoner profile page
    await page.goto(`/prisoner/${prisonerId}`)
    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page, 'Smith, John')

    // Select visiting orders tab
    await orchestrationApi.stubGetVoHistory()
    await prisonerProfilePage.visitingOrdersTab.click()
    await prisonerProfilePage.visitingOrdersTabShowVoHistoryLink.click()

    // Visiting orders history page - prisoner details
    const visitOrdersHistoryPage = await VisitOrdersHistoryPage.verifyOnPage(page)
    await expect(visitOrdersHistoryPage.prisonerName).toContainText('John Smith')
    await expect(visitOrdersHistoryPage.prisonerCategory).toContainText('Cat C')
    await expect(visitOrdersHistoryPage.prisonerConvictedStatus).toContainText('Convicted')
    await expect(visitOrdersHistoryPage.prisonerIncentiveLevel).toContainText('Standard')

    // Visiting orders history page - history table
    await expect(visitOrdersHistoryPage.date(0)).toContainText('1/12/2025')
    await expect(visitOrdersHistoryPage.reason(0)).toContainText('VO allocation (standard incentive level)')
    await expect(visitOrdersHistoryPage.voChange(0)).toContainText('1')
    await expect(visitOrdersHistoryPage.voBalance(0)).toContainText('5')
    await expect(visitOrdersHistoryPage.pvoChange(0)).toContainText('0')
    await expect(visitOrdersHistoryPage.pvoBalance(0)).toContainText('2')
  })
})
