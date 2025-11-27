import { expect, test } from '@playwright/test'
import orchestrationApi from '../mockApis/orchestration'

import { login, resetStubs } from '../testUtils'
import HomePage from '../pages-playwright/homePage'
import TestData from '../../server/routes/testutils/testData'
import bapvUserRoles from '../../server/constants/bapvUserRoles'

test.describe('Home page', () => {
  const prisonStaffOnly = TestData.prisonDto({ clients: [{ userType: 'STAFF', active: true }] })
  const prisonStaffAndPublic = TestData.prisonDto({
    clients: [
      { userType: 'STAFF', active: true },
      { userType: 'PUBLIC', active: true },
    ],
  })

  const visitRequestCount = TestData.visitRequestCount()
  const notificationCount = TestData.notificationCount()

  test.beforeEach(async () => {
    await orchestrationApi.stubSupportedPrisonIds()
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should render the index page with the correct tiles - non-PUBLIC prison', async ({ page }) => {
    await orchestrationApi.stubGetPrison(prisonStaffOnly)
    await orchestrationApi.stubGetNotificationCount({ notificationCount })
    await login(page)

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.bookOrChangeVisitTile).toContainText('Book or change a visit')
    await expect(homePage.visitRequestsTile).toHaveCount(0)
    await expect(homePage.needReviewTile).toContainText('Visits that need review')
    await expect(homePage.needReviewBadgeCount).toContainText(notificationCount.count.toString())
    await expect(homePage.viewVisitsTile).toContainText('View visits by date')
    await expect(homePage.viewTimetableTile).toContainText('Visits timetable')
    await expect(homePage.bookerManagementTile).toHaveCount(0)
    await expect(homePage.blockDatesTile).toContainText('Block visit dates')
  })

  test('should render the index page with the booker management tile', async ({ page }) => {
    await orchestrationApi.stubGetPrison(prisonStaffOnly)
    await orchestrationApi.stubGetNotificationCount({ notificationCount })
    await login(page, { roles: [`ROLE_${bapvUserRoles.STAFF_USER}`, `ROLE_${bapvUserRoles.BOOKER_ADMIN}`] })

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.bookerManagementTile).toContainText('Manage online bookers')
  })

  test('should render the index page with the correct tiles (inc visit requests) - PUBLIC prison', async ({ page }) => {
    await orchestrationApi.stubGetPrison(prisonStaffAndPublic)
    await orchestrationApi.stubGetVisitRequestCount({ visitRequestCount })
    await orchestrationApi.stubGetNotificationCount({ notificationCount })
    await login(page, { roles: [`ROLE_${bapvUserRoles.STAFF_USER}`, `ROLE_${bapvUserRoles.BOOKER_ADMIN}`] })

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.bookOrChangeVisitTile).toContainText('Book or change a visit')
    await expect(homePage.visitRequestsTile).toContainText('Requested visits')
    await expect(homePage.visitRequestsBadgeCount).toContainText(visitRequestCount.count.toString())
    await expect(homePage.needReviewTile).toContainText('Visits that need review')
    await expect(homePage.needReviewBadgeCount).toContainText(notificationCount.count.toString())
    await expect(homePage.viewVisitsTile).toContainText('View visits by date')
    await expect(homePage.viewTimetableTile).toContainText('Visits timetable')
    await expect(homePage.bookerManagementTile).toContainText('Manage online bookers')
    await expect(homePage.blockDatesTile).toContainText('Block visit dates')
  })
})
