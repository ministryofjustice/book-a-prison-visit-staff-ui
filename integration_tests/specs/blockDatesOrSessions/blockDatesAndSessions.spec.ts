import { expect, test } from '@playwright/test'
import { format } from 'date-fns'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'

import BlockDatesOrSessionsPage from '../../pages/blockDatesOrSessions/blockDatesOrSessionsPage'
import BlockDateConfirmationPage from '../../pages/blockDatesOrSessions/blockDates/blockDateConfirmationPage'
import TestData from '../../../server/routes/testutils/testData'
import ChooseDateOrSessionBlockPage from '../../pages/blockDatesOrSessions/chooseDateOrSessionBlockPage'
import BlockSessionChoosePage from '../../pages/blockDatesOrSessions/blockSessions/blockSessionChoosePage'
import BlockSessionConfirmPage from '../../pages/blockDatesOrSessions/blockSessions/blockSessionConfirmPage'

test.describe('Block visit dates and sessions', () => {
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

  test.describe('Block visit dates', () => {
    test('should block a new date - where date has no sessions to block', async ({ page }) => {
      await orchestrationApi.stubGetFutureBlockedDatesAndSessions({ includeSessions: true })
      await orchestrationApi.stubGetFutureBlockedDatesAndSessions({ includeSessions: false })

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
      await orchestrationApi.stubGetBookedVisitCountByDate({
        date: firstOfNextMonthShort,
        count: 0,
      })
      await orchestrationApi.stubSessionSchedule({
        date: firstOfNextMonthShort,
        includeExcludedSessions: true,
        sessionSchedule: [],
      })

      await blockDatesOrSessionsPage.continueButton.click()

      // Confirmation page
      const blockDateConfirmationPage = await BlockDateConfirmationPage.verifyOnPage(page, firstOfNextMonthLong)

      // Stub adding visit date block
      await orchestrationApi.stubBlockVisitDate({ date: firstOfNextMonthShort })

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
      await orchestrationApi.stubUnblockVisitDate({ date: firstOfNextMonthShort })

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

  test.describe('Block visit sessions', () => {
    const morningSession = TestData.sessionSchedule({
      sessionTemplateReference: 'morning-session',
      sessionTimeSlot: { startTime: '09:00', endTime: '10:00' },
    })
    const afternoonSession = TestData.sessionSchedule({
      sessionTemplateReference: 'afternoon-session',
      sessionTimeSlot: { startTime: '14:00', endTime: '15:30' },
    })

    test('should block a visit session', async ({ page }) => {
      await orchestrationApi.stubGetFutureBlockedDatesAndSessions({ includeSessions: true })
      await orchestrationApi.stubGetFutureBlockedDatesAndSessions({ includeSessions: false })

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
      await orchestrationApi.stubGetBookedVisitCountByDate({ date: firstOfNextMonthShort, count: 0 })
      await orchestrationApi.stubSessionSchedule({
        date: firstOfNextMonthShort,
        includeExcludedSessions: true,
        sessionSchedule: [morningSession, afternoonSession],
      })

      await blockDatesOrSessionsPage.continueButton.click()

      // Choose full date or single session block page
      const chooseDateOrSessionBlockPage = await ChooseDateOrSessionBlockPage.verifyOnPage(page, firstOfNextMonthLong)
      await chooseDateOrSessionBlockPage.selectSingleSession()
      await chooseDateOrSessionBlockPage.continue()

      // Choose which session to block page
      const blockSessionChoosePage = await BlockSessionChoosePage.verifyOnPage(page, firstOfNextMonthLong)
      await blockSessionChoosePage.selectSession('2pm to 3:30pm (Visits hall), All prisoners') // afternoon session
      await orchestrationApi.stubGetVisitsBySessionTemplate({
        reference: afternoonSession.sessionTemplateReference,
        sessionDate: firstOfNextMonthShort,
        visits: [],
      })
      await blockSessionChoosePage.continue()

      // Confirmation page
      const blockSessionConfirmPage = await BlockSessionConfirmPage.verifyOnPage(page, firstOfNextMonthLong)
      await expect(blockSessionConfirmPage.sessionDetails).toContainText('2pm to 3:30pm (Visits hall), All prisoners')

      // Stub adding session date block
      await orchestrationApi.stubBlockVisitSession({
        sessionTemplateReference: afternoonSession.sessionTemplateReference,
        date: firstOfNextMonthShort,
      })

      await orchestrationApi.stubGetFutureBlockedDatesAndSessions({
        includeSessions: true,
        blockedDatesAndSessions: {
          fullDateExclusions: [],
          sessionExclusions: [
            TestData.sessionExcludeDateDto({
              excludeDate: { excludeDate: firstOfNextMonthShort, actionedBy: 'User two' },
              sessionTimeSlot: afternoonSession.sessionTimeSlot,
            }),
          ],
        },
      })

      // Confirm visit date block
      await blockSessionConfirmPage.selectYes()
      await blockSessionConfirmPage.continue()

      // Verify success message and blocked date exists
      await expect(blockDatesOrSessionsPage.messages).toBeVisible()
      await expect(blockDatesOrSessionsPage.messages).toContainText(
        `Visits are blocked on ${firstOfNextMonthLong} for 2pm to 3:30pm (Visits hall), All prisoners`,
      )

      await expect(blockDatesOrSessionsPage.blockedDate(1)).toContainText(firstOfNextMonthLong)
      await expect(blockDatesOrSessionsPage.blockedWhen(1)).toContainText('2pm to 3:30pm')
      await expect(blockDatesOrSessionsPage.blockedAttendees(1)).toContainText('All prisoners')
      await expect(blockDatesOrSessionsPage.blockedBy(1)).toContainText('User two')
      await expect(blockDatesOrSessionsPage.unblockLink(1)).toContainText('Unblock')
    })

    test('should unblock a visit session', async ({ page }) => {
      // Stub an existing blocked session
      await orchestrationApi.stubGetFutureBlockedDatesAndSessions({
        includeSessions: true,
        blockedDatesAndSessions: {
          fullDateExclusions: [],
          sessionExclusions: [
            TestData.sessionExcludeDateDto({
              excludeDate: { excludeDate: firstOfNextMonthShort, actionedBy: 'User two' },
              sessionTemplateReference: morningSession.sessionTemplateReference,
              sessionTimeSlot: morningSession.sessionTimeSlot,
            }),
          ],
        },
      })

      // Navigate to blocked visit dates or sessions page
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.blockDatesTile.click()

      // Verify blocked date exists
      const blockDatesOrSessionsPage = await BlockDatesOrSessionsPage.verifyOnPage(page)
      await expect(blockDatesOrSessionsPage.blockedDate(1)).toContainText(firstOfNextMonthLong)
      await expect(blockDatesOrSessionsPage.blockedWhen(1)).toContainText('9am to 10am')
      await expect(blockDatesOrSessionsPage.blockedWhen(1)).toContainText('Visits hall')
      await expect(blockDatesOrSessionsPage.blockedAttendees(1)).toContainText('All prisoners')
      await expect(blockDatesOrSessionsPage.blockedBy(1)).toContainText('User two')
      await expect(blockDatesOrSessionsPage.unblockLink(1)).toContainText('Unblock')

      // Stub unblocking session
      await orchestrationApi.stubUnblockVisitSession({
        sessionTemplateReference: morningSession.sessionTemplateReference,
        date: firstOfNextMonthShort,
      })
      await orchestrationApi.stubSessionSchedule({
        date: firstOfNextMonthShort,
        sessionSchedule: [morningSession, afternoonSession],
        includeExcludedSessions: true,
      })

      // Stub no future blocked dates or sessions after unblock
      await orchestrationApi.stubGetFutureBlockedDatesAndSessions({ includeSessions: true })

      // Unblock session
      await blockDatesOrSessionsPage.unblockLink(1).click()

      // Verify success message
      await expect(blockDatesOrSessionsPage.messages).toBeVisible()
      await expect(blockDatesOrSessionsPage.messages).toContainText(
        `Visits are unblocked on ${firstOfNextMonthLong} for 9am to 10am (Visits hall), All prisoners`,
      )

      // Verify no upcoming blocked dates or sessions
      await expect(blockDatesOrSessionsPage.noBlockedDatesOrSessions).toContainText(
        'no upcoming blocked visit dates or sessions',
      )
    })
  })
})
