import { expect, test } from '@playwright/test'
import { format } from 'date-fns'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages-playwright/homePage'
import BlockVisitDateConfirmationPage from '../../pages-playwright/blockVisitDates/blockVisitConfirmationPage'
import BlockVisitDatesPage from '../../pages-playwright/blockVisitDates/blockVisitDatesPage'
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
    const blockedDatesPage = await BlockVisitDatesPage.verifyOnPage(page)
    await blockedDatesPage.verifyHeading('Blocked dates', 2)
    await expect(blockedDatesPage.noBlockedDates).toContainText('no upcoming blocked dates')

    // select the 1st day of next month
    await blockedDatesPage.datePicker.toggleCalendar()
    await blockedDatesPage.datePicker.goToNextMonth()
    await blockedDatesPage.datePicker.selectDay(1)

    // Stub booked visits count
    await orchestrationApi.stubGetBookedVisitCountByDate({
      prisonId: 'HEI',
      date: firstOfNextMonthShort,
      count: 0,
    })

    await blockedDatesPage.continueButton.click()

    // Confirmation page
    const confirmPage = await BlockVisitDateConfirmationPage.verifyOnPage(page, firstOfNextMonthLong)

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

    await confirmPage.selectYes()
    await confirmPage.continue()
    const successMessage = blockedDatesPage.getSuccessMessage()
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toContainText(`Visits are blocked for ${firstOfNextMonthLong}.`)

    await expect(blockedDatesPage.blockedDate(1)).toContainText(firstOfNextMonthLong)
    await expect(blockedDatesPage.blockedBy(1)).toContainText('User one')
    await expect(blockedDatesPage.unblockLink(1)).toContainText('Unblock')
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

    const blockedDatesPage = await BlockVisitDatesPage.verifyOnPage(page)

    // Verify blocked date exists
    await expect(blockedDatesPage.blockedDate(1)).toContainText(firstOfNextMonthLong)
    await expect(blockedDatesPage.blockedBy(1)).toContainText('User one')
    await expect(blockedDatesPage.unblockLink(1)).toBeVisible()

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
    await blockedDatesPage.unblockLink(1).click()

    // Verify success message
    const successMessage = blockedDatesPage.getSuccessMessage()
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toContainText(`Visits are unblocked for ${firstOfNextMonthLong}.`)

    // Verify no upcoming blocked dates
    await expect(blockedDatesPage.noBlockedDates).toContainText('no upcoming blocked dates')
  })
})
