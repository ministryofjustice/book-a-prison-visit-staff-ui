import { expect, test } from '@playwright/test'
import orchestrationApi from '../../../mockApis/orchestration'
import { login, resetStubs } from '../../../testUtils'
import TestData from '../../../../server/routes/testutils/testData'
import PrisonerProfilePage from '../../../pages-playwright/prisoner/prisonerProfilePage'
import EditVoBalancePage from '../../../pages-playwright/prisoner/visitOrders/editVoBalancePage'

test.describe('Visiting orders - edit balances', () => {
  const profile = TestData.prisonerProfile()
  const { prisonerId } = profile

  test.beforeEach(async ({ page }) => {
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount()
    await orchestrationApi.stubGetVisitorRequests()

    await orchestrationApi.stubPrisonerProfile(profile)
    await orchestrationApi.stubGetVoBalance()

    await login(page)
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should navigate from prisoner profile to edit balances', async ({ page }) => {
    // Go to prisoner profile page
    await page.goto(`/prisoner/${prisonerId}`)
    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page, 'Smith, John')

    // Select visiting orders tab
    await prisonerProfilePage.visitingOrdersTab.click()
    await prisonerProfilePage.visitingOrdersTabEditVoLink.click()

    // Edit VO balance page - complete form
    const editVoBalancePage = await EditVoBalancePage.verifyOnPage(page)
    await expect(editVoBalancePage.prisonerName).toContainText('John Smith')
    await expect(editVoBalancePage.voBalance).toContainText('5')
    await expect(editVoBalancePage.pvoBalance).toContainText('2')

    await editVoBalancePage.changeBalance('VO', 'Add', '2')
    await editVoBalancePage.changeBalance('PVO', 'Remove', '1')
    await editVoBalancePage.enterChangeReason('Governor’s adjustment', 'a reason for extra visits')

    // Edit VO balance page - submit form
    await orchestrationApi.stubChangeVoBalance({
      prisonerBalanceAdjustmentDto: TestData.prisonerBalanceAdjustmentDto({
        voAmount: 2,
        pvoAmount: -1,
        adjustmentReasonType: 'GOVERNOR_ADJUSTMENT',
        adjustmentReasonText: 'a reason for extra visits',
        userName: 'USER1',
      }),
    })
    await orchestrationApi.stubPrisonerProfile({
      ...profile,
      visitBalances: { ...profile.visitBalances, remainingVo: 7, remainingPvo: 1 },
    })
    await editVoBalancePage.editBalanceButton.click()

    // Return to prisoner profile page and verify updated balances
    await PrisonerProfilePage.verifyOnPage(page, 'Smith, John')
    await expect(prisonerProfilePage.visitingOrdersTabVORemaining).toContainText('7')
    await expect(prisonerProfilePage.visitingOrdersTabPVORemaining).toContainText('1')
  })

  test('should navigate from prisoner profile to edit balances - with validation failure', async ({ page }) => {
    // Go to prisoner profile page
    await page.goto(`/prisoner/${prisonerId}`)
    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page, 'Smith, John')

    // Select visiting orders tab
    await prisonerProfilePage.visitingOrdersTab.click()
    await prisonerProfilePage.visitingOrdersTabEditVoLink.click()

    // Edit VO balance page - complete form
    const editVoBalancePage = await EditVoBalancePage.verifyOnPage(page)
    await expect(editVoBalancePage.prisonerName).toContainText('John Smith')
    await expect(editVoBalancePage.voBalance).toContainText('5')
    await expect(editVoBalancePage.pvoBalance).toContainText('2')

    // Add / remove amounts that will trigger validation errors
    await editVoBalancePage.changeBalance('VO', 'Add', '26')
    await editVoBalancePage.changeBalance('PVO', 'Remove', '25')
    await editVoBalancePage.enterChangeReason('Governor’s adjustment', 'a reason for extra visits')

    // Edit VO balance page - submit form
    await orchestrationApi.stubChangeVoBalanceFail({
      validationErrors: ['VO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX', 'PVO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO'],
    })
    await editVoBalancePage.editBalanceButton.click()

    // Returned to edit VO page with validation errors displayed
    await EditVoBalancePage.verifyOnPage(page)
    await expect(
      editVoBalancePage.getErrorSummaryMessage('The VO limit is 26. You can add a maximum of 21 VOs.'),
    ).toBeVisible()
    await expect(
      editVoBalancePage.getErrorSummaryMessage(
        'The PVO balance cannot go below 0. You can remove a maximum of 2 PVOs.',
      ),
    ).toBeVisible()
  })
})
