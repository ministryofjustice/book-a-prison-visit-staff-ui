import { test } from '@playwright/test'
import { format } from 'date-fns'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'
import VisitsByDatePage from '../../pages/visitsByDate/visitsByDatePage'
import VisitPassesPage from '../../pages/visitPasses/visitPassesPage'

test.describe('Print visit passes', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const today = new Date()
  const todayShortFormat = format(today, shortDateFormat)
  const prisonId = 'HEI'

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})

    await orchestrationApi.stubSessionSchedule({ prisonId, date: todayShortFormat, sessionSchedule: [] })
    await orchestrationApi.stubGetVisitsWithoutSessionTemplate({ prisonId, sessionDate: todayShortFormat, visits: [] })
    await orchestrationApi.stubIsBlockedDate({ prisonId, excludeDate: todayShortFormat, excludeDates: [] })

    await orchestrationApi.stubGetVisitPasses({ date: todayShortFormat })

    await login(page)
  })

  test('should navigate to print visit passes page and trigger print dialog', async ({ page }) => {
    // Navigate to Visits by date page
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.viewVisitsTile.click()
    const visitsByDatePage = await VisitsByDatePage.verifyOnPage(page)

    // Click 'Print visit passes' button
    await visitsByDatePage.printVisitPasses.click()
    const visitPassesPage = await VisitPassesPage.verifyOnPage(page)

    // Visit passes page
    // TODO extend to check pass contents

    // Print button should trigger print dialog
    await visitPassesPage.printAllAndCheckForPrintDialog()
  })
})
