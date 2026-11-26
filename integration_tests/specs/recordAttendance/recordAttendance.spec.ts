import { test } from '@playwright/test'
import HomePage from '../../pages/homePage'
import orchestrationApi from '../../mockApis/orchestration'
import { resetStubs, login } from '../../testUtils'
import RecordAttendanceListingPage from '../../pages/recordAttendance/recordAttendanceListingPage'

test.describe('Record visit attendance', () => {
  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount()
    await orchestrationApi.stubGetVisitorRequestCount()
    await orchestrationApi.stubGetVisitRequestCount()

    await login(page)
  })

  test('should record attendance for a visit', async ({ page }) => {
    const homePage = await HomePage.verifyOnPage(page)

    // Navigate to Record attendance page
    await homePage.recordAttendanceTile.click()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const recordAttendanceListingPage = await RecordAttendanceListingPage.verifyOnPage(page)

    // TODO flesh out journey as it is implemented
  })
})
