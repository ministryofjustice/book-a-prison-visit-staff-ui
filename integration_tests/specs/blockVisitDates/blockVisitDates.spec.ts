import { expect, test } from '@playwright/test'
import { format } from 'date-fns'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages-playwright/homePage'

import BlockVisitDatesPage from '../../pages-playwright/blockVisitDates/blockVisitDatesPage'
import BlockVisitDateConfirmationPage from '../../pages-playwright/blockVisitDates/blockVisitDateConfirmationPage'
import TestData from '../../../server/routes/testutils/testData'

test.describe('Block visit dates', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  const today = new Date()
  const firstOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const firstOfNextMonthShort = format(firstOfNextMonth, shortDateFormat)
  const firstOfNextMonthLong = format(firstOfNextMonth, longDateFormat)

  test.beforeEach(async () => {
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should block a new date', async ({ page }) => {
    await orchestrationApi.stubGetFutureBlockedDates({ blockedDates: [] })
    await login(page)
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.blockDatesTile.click()

    // verify page
    const blockVisitDatesPage = await BlockVisitDatesPage.verifyOnPage(page)
    await expect(blockVisitDatesPage.noBlockedDates).toContainText('no upcoming blocked dates')

    // select the 1st day of next month
    await blockVisitDatesPage.datePicker.toggleCalendar()
    await blockVisitDatesPage.datePicker.goToNextMonth()
    await blockVisitDatesPage.datePicker.selectDay(1)

    // Stub booked visits count
    await orchestrationApi.stubGetBookedVisitCountByDate({
      prisonId: 'HEI',
      date: firstOfNextMonthShort,
      count: 0,
    })

    await blockVisitDatesPage.continueButton.click()

    // Confirmation page
    const blockVisitDateConfirmationPage = await BlockVisitDateConfirmationPage.verifyOnPage(page, firstOfNextMonthLong)

    // Stub block visit date correctly
    await orchestrationApi.stubBlockVisitDate({
      prisonId: 'HEI',
      date: firstOfNextMonthShort,
      username: 'USER1',
    })

    await orchestrationApi.stubGetFutureBlockedDates({
      prisonId: 'HEI',
      blockedDates: [TestData.excludeDateDto({ excludeDate: firstOfNextMonthShort })],
    })

    await blockVisitDateConfirmationPage.selectYes()
    await blockVisitDateConfirmationPage.continue()
    const successMessage = blockVisitDatesPage.getSuccessMessage()
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toContainText(`Visits are blocked for ${firstOfNextMonthLong}.`)

    await expect(blockVisitDatesPage.blockedDate(1)).toContainText(firstOfNextMonthLong)
    await expect(blockVisitDatesPage.blockedBy(1)).toContainText('User one')
    await expect(blockVisitDatesPage.unblockLink(1)).toContainText('Unblock')
  })

  test('should go to block dates listing page and unblock a date', async ({ page }) => {
    // Stub API to show an existing blocked date
    await orchestrationApi.stubGetFutureBlockedDates({
      prisonId: 'HEI',
      blockedDates: [TestData.excludeDateDto({ excludeDate: firstOfNextMonthShort })],
    })

    // Login and navigate to Blocked Dates page
    await login(page)
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.blockDatesTile.click()

    const blockVisitDatesPage = await BlockVisitDatesPage.verifyOnPage(page)

    // Verify blocked date exists
    await expect(blockVisitDatesPage.blockedDate(1)).toContainText(firstOfNextMonthLong)
    await expect(blockVisitDatesPage.blockedBy(1)).toContainText('User one')
    await expect(blockVisitDatesPage.unblockLink(1)).toBeVisible()

    // Stub API for unblocking
    await orchestrationApi.stubUnblockVisitDate({
      prisonId: 'HEI',
      date: firstOfNextMonthShort,
      username: 'USER1',
    })

    // Stub future blocked dates after unblock
    await orchestrationApi.stubGetFutureBlockedDates({
      prisonId: 'HEI',
      blockedDates: [],
    })

    // Click unblock
    await blockVisitDatesPage.unblockLink(1).click()

    // Verify success message
    const successMessage = blockVisitDatesPage.getSuccessMessage()
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toContainText(`Visits are unblocked for ${firstOfNextMonthLong}.`)

    // Verify no upcoming blocked dates
    await expect(blockVisitDatesPage.noBlockedDates).toContainText('no upcoming blocked dates')
  })
})
