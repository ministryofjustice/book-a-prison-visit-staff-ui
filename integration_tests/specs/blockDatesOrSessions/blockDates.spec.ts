import { expect, test } from '@playwright/test'
import { format } from 'date-fns'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'

import BlockDatesOrSessionsPage from '../../pages/blockDatesOrSessions/blockDatesOrSessionsPage'
import BlockDateConfirmationPage from '../../pages/blockDatesOrSessions/blockDateConfirmationPage'
import TestData from '../../../server/routes/testutils/testData'

test.describe('Block visit dates or sessions', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  const today = new Date()
  const firstOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const firstOfNextMonthShort = format(firstOfNextMonth, shortDateFormat)
  const firstOfNextMonthLong = format(firstOfNextMonth, longDateFormat)

  const prisonId = 'HEI'

  test.beforeEach(async () => {
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should block a new date - where date has no sessions to block', async ({ page }) => {
    await orchestrationApi.stubGetFutureBlockedDatesAndSessions({ includeSessions: true })
    await login(page)
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.blockDatesTile.click()

    // Blocked dates or sessions page
    const blockDatesOrSessionsPage = await BlockDatesOrSessionsPage.verifyOnPage(page)
    await expect(blockDatesOrSessionsPage.noBlockedDatesOrSessions).toContainText(
      'no upcoming blocked visit dates or sessions',
    )

    // Select the 1st day of next month
    await blockDatesOrSessionsPage.datePicker.toggleCalendar()
    await blockDatesOrSessionsPage.datePicker.goToNextMonth()
    await blockDatesOrSessionsPage.datePicker.selectDay(1)

    // Stub booked visits count and no scheduled sessions for the selected date
    await orchestrationApi.stubGetFutureBlockedDates({ blockedDates: [] }) // TODO this can be removed once this deprecated endpoint is replaced
    await orchestrationApi.stubGetBookedVisitCountByDate({
      prisonId,
      date: firstOfNextMonthShort,
      count: 0,
    })
    await orchestrationApi.stubSessionSchedule({
      prisonId,
      date: firstOfNextMonthShort,
      includeExcludedSessions: false,
      sessionSchedule: [],
    })

    await blockDatesOrSessionsPage.continueButton.click()

    // Confirmation page
    const blockDateConfirmationPage = await BlockDateConfirmationPage.verifyOnPage(page, firstOfNextMonthLong)

    // Stub adding visit date block
    await orchestrationApi.stubBlockVisitDate({
      prisonId,
      date: firstOfNextMonthShort,
      username: 'USER1',
    })

    await orchestrationApi.stubGetFutureBlockedDatesAndSessions({
      includeSessions: true,
      blockedDatesAndSessions: {
        fullDateExclusions: [TestData.excludeDateDto({ excludeDate: firstOfNextMonthShort })],
        sessionExclusions: [],
      },
    })

    // Confirm visit date block
    await blockDateConfirmationPage.selectYes()
    await blockDateConfirmationPage.continue()

    // Verify success message and blocked date exists
    await expect(blockDatesOrSessionsPage.messages).toBeVisible()
    await expect(blockDatesOrSessionsPage.messages).toContainText(`Visits are blocked for ${firstOfNextMonthLong}.`)

    await expect(blockDatesOrSessionsPage.blockedDate(1)).toContainText(firstOfNextMonthLong)
    await expect(blockDatesOrSessionsPage.blockedWhen(1)).toContainText('All day')
    await expect(blockDatesOrSessionsPage.blockedAttendees(1)).toContainText('All prisoners')
    await expect(blockDatesOrSessionsPage.blockedBy(1)).toContainText('User one')
    await expect(blockDatesOrSessionsPage.unblockLink(1)).toContainText('Unblock')
  })

  test('should unblock a date', async ({ page }) => {
    // Stub an existing blocked date
    await orchestrationApi.stubGetFutureBlockedDatesAndSessions({
      includeSessions: true,
      blockedDatesAndSessions: {
        fullDateExclusions: [TestData.excludeDateDto({ excludeDate: firstOfNextMonthShort })],
        sessionExclusions: [],
      },
    })

    // Navigate to blocked visit dates or sessions page
    await login(page)
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.blockDatesTile.click()

    // Verify blocked date exists
    const blockDatesOrSessionsPage = await BlockDatesOrSessionsPage.verifyOnPage(page)
    await expect(blockDatesOrSessionsPage.blockedDate(1)).toContainText(firstOfNextMonthLong)
    await expect(blockDatesOrSessionsPage.blockedBy(1)).toContainText('User one')
    await expect(blockDatesOrSessionsPage.unblockLink(1)).toBeVisible()

    // Stub unblocking date
    await orchestrationApi.stubUnblockVisitDate({
      prisonId,
      date: firstOfNextMonthShort,
      username: 'USER1',
    })

    // Stub no future blocked dates after unblock
    await orchestrationApi.stubGetFutureBlockedDatesAndSessions({ includeSessions: true })

    // Unblock date
    await blockDatesOrSessionsPage.unblockLink(1).click()

    // Verify success message
    await expect(blockDatesOrSessionsPage.messages).toBeVisible()
    await expect(blockDatesOrSessionsPage.messages).toContainText(`Visits are unblocked for ${firstOfNextMonthLong}.`)

    // Verify no upcoming blocked dates
    await expect(blockDatesOrSessionsPage.noBlockedDatesOrSessions).toContainText(
      'no upcoming blocked visit dates or sessions',
    )
  })
})
