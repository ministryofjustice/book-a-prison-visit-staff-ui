import { test, expect } from '@playwright/test'
import { addYears, format, nextMonday, nextWednesday, previousMonday } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import HomePage from '../../pages-playwright/homePage'
import VisitTimetablePage from '../../pages-playwright/visitTimetable/visitTimetablePage'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'

test.describe('View visit schedule timetable', () => {
  const prisonId = 'HEI'
  const shortDateFormat = 'yyyy-MM-dd'
  const mediumDateFormat = 'd MMMM yyyy'
  const today = new Date()

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
    await login(page)
  })

  test('should show the visits timetable with the current day selected', async ({ page }) => {
    const futureEndDate = addYears(today, 1)

    const sessionSchedule = [
      TestData.sessionSchedule({
        sessionTimeSlot: { startTime: '10:00', endTime: '11:30' },
        prisonerIncentiveLevelGroupNames: ['Enhanced'],
        capacity: { open: 20, closed: 5 },
        prisonerLocationGroupNames: ['Group 1', 'Group 2'],
        weeklyFrequency: 2,
      }),
      TestData.sessionSchedule(),
      TestData.sessionSchedule({
        prisonerCategoryGroupNames: ['Category A (High Risk)'],
        sessionDateRange: { validFromDate: '2023-02-01', validToDate: format(futureEndDate, shortDateFormat) },
        weeklyFrequency: 3,
      }),
      TestData.sessionSchedule({
        sessionDateRange: {
          validFromDate: format(today, shortDateFormat),
          validToDate: format(today, shortDateFormat),
        },
      }),
    ]

    await orchestrationApi.stubSessionSchedule({ prisonId, date: format(today, shortDateFormat), sessionSchedule })

    // Home page
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.viewTimetableTile.click()

    // Visit timetable page
    const visitTimetablePage = await VisitTimetablePage.verifyOnPage(page)
    await visitTimetablePage.checkSelectedDate(today)

    // Assertions for first two sessions
    await expect(visitTimetablePage.scheduleTime(1)).toHaveText('10am to 11:30am')
    await expect(visitTimetablePage.scheduleType(1)).toHaveText('Open')
    await expect(visitTimetablePage.scheduleCapacity(1)).toHaveText('20 tables')
    await expect(visitTimetablePage.scheduleAttendees(1)).toHaveText('Prisoners on Enhanced in Group 1 and Group 2')
    await expect(visitTimetablePage.scheduleFrequency(1)).toHaveText('Every 2 weeks')
    await expect(visitTimetablePage.scheduleEndDate(1)).toHaveText('Not entered')

    await expect(visitTimetablePage.scheduleTime(2)).toHaveText('10am to 11:30am')
    await expect(visitTimetablePage.scheduleType(2)).toHaveText('Closed')
    await expect(visitTimetablePage.scheduleCapacity(2)).toHaveText('5 tables')
    await expect(visitTimetablePage.scheduleAttendees(2)).toHaveText('Prisoners on Enhanced in Group 1 and Group 2')
    await expect(visitTimetablePage.scheduleFrequency(2)).toHaveText('Every 2 weeks')
    await expect(visitTimetablePage.scheduleEndDate(2)).toHaveText('Not entered')

    // Additional sessions
    await expect(visitTimetablePage.scheduleTime(3)).toHaveText('1:45pm to 3:45pm')
    await expect(visitTimetablePage.scheduleType(3)).toHaveText('Open')
    await expect(visitTimetablePage.scheduleCapacity(3)).toHaveText('40 tables')
    await expect(visitTimetablePage.scheduleAttendees(3)).toHaveText('All prisoners')
    await expect(visitTimetablePage.scheduleFrequency(3)).toHaveText('Every week')
    await expect(visitTimetablePage.scheduleEndDate(3)).toHaveText('Not entered')

    await expect(visitTimetablePage.scheduleTime(4)).toHaveText('1:45pm to 3:45pm')
    await expect(visitTimetablePage.scheduleType(4)).toHaveText('Open')
    await expect(visitTimetablePage.scheduleCapacity(4)).toHaveText('40 tables')
    await expect(visitTimetablePage.scheduleAttendees(4)).toContainText('Category A (High Risk)')
    await expect(visitTimetablePage.scheduleFrequency(4)).toHaveText('Every 3 weeks')
    await expect(visitTimetablePage.scheduleEndDate(4)).toHaveText(format(futureEndDate, mediumDateFormat))

    await expect(visitTimetablePage.scheduleFrequency(5)).toHaveText('One off')
    await expect(visitTimetablePage.scheduleEndDate(5)).toHaveText(format(today, mediumDateFormat))

    await expect(visitTimetablePage.requestChangeLink).toHaveAttribute(
      'href',
      'https://request-changes-to-the-visits-timetable.form.service.justice.gov.uk/',
    )
  })

  test('should allow navigation between weeks and date selection', async ({ page }) => {
    await orchestrationApi.stubSessionSchedule({ prisonId, date: format(today, shortDateFormat), sessionSchedule: [] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.viewTimetableTile.click()

    const visitTimetablePage = await VisitTimetablePage.verifyOnPage(page)
    await visitTimetablePage.checkSelectedDate(today)
    await expect(visitTimetablePage.emptySchedule).toHaveText('No visit sessions on this day.')

    // Navigate next week
    const nextMon = nextMonday(today)
    await orchestrationApi.stubSessionSchedule({
      prisonId,
      date: format(nextMon, shortDateFormat),
      sessionSchedule: [],
    })
    await visitTimetablePage.goToNextWeek()
    await visitTimetablePage.checkSelectedDate(nextMon)

    // Navigate specific day
    const followingWeds = nextWednesday(nextMon)
    await orchestrationApi.stubSessionSchedule({
      prisonId,
      date: format(followingWeds, shortDateFormat),
      sessionSchedule: [],
    })
    await visitTimetablePage.goToDay(2)
    await visitTimetablePage.checkSelectedDate(followingWeds)

    // Navigate previous week
    const previousMon = previousMonday(nextMon)
    await orchestrationApi.stubSessionSchedule({
      prisonId,
      date: format(previousMon, shortDateFormat),
      sessionSchedule: [],
    })
    await visitTimetablePage.goToPreviousWeek()
    await visitTimetablePage.checkSelectedDate(previousMon)
  })
})
