import { test, expect } from '@playwright/test'
import { format, nextMonday, nextWednesday, previousMonday } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import HomePage from '../../pages/homePage'
import VisitTimetablePage from '../../pages/visitTimetable/visitTimetablePage'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'

test.describe('View visit schedule timetable', () => {
  const prisonId = 'HEI'
  const shortDateFormat = 'yyyy-MM-dd'
  const today = new Date()

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
    await login(page)
  })

  test('should show the visits timetable with the current day selected', async ({ page }) => {
    const sessionSchedule = [
      TestData.sessionSchedule({
        sessionTimeSlot: { startTime: '10:00', endTime: '11:30' },
        prisonerIncentiveLevelGroupNames: ['Enhanced'],
        capacity: { open: 20, closed: 5 },
        prisonerLocationGroupNames: ['Group 1', 'Group 2'],
        isAgeRestricted: true,
        ageRestriction: 16,
      }),
      TestData.sessionSchedule(),
      TestData.sessionSchedule({
        prisonerCategoryGroupNames: ['Category A (High Risk)'],
        isAgeRestricted: true,
        ageRestriction: 18,
      }),
    ]

    await orchestrationApi.stubSessionSchedule({
      prisonId,
      date: format(today, shortDateFormat),
      includeExcludedSessions: false,
      sessionSchedule,
    })

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
    await expect(visitTimetablePage.scheduleVisitors(1)).toHaveText('Visitors aged 16 years old or older')
    await expect(visitTimetablePage.schedulePrisoners(1)).toHaveText('Prisoners on Enhanced in Group 1 and Group 2')

    await expect(visitTimetablePage.scheduleTime(2)).toHaveText('10am to 11:30am')
    await expect(visitTimetablePage.scheduleType(2)).toHaveText('Closed')
    await expect(visitTimetablePage.scheduleCapacity(2)).toHaveText('5 tables')
    await expect(visitTimetablePage.scheduleVisitors(2)).toHaveText('Visitors aged 16 years old or older')
    await expect(visitTimetablePage.schedulePrisoners(2)).toHaveText('Prisoners on Enhanced in Group 1 and Group 2')

    // Additional sessions
    await expect(visitTimetablePage.scheduleTime(3)).toHaveText('1:45pm to 3:45pm')
    await expect(visitTimetablePage.scheduleType(3)).toHaveText('Open')
    await expect(visitTimetablePage.scheduleCapacity(3)).toHaveText('40 tables')
    await expect(visitTimetablePage.scheduleVisitors(3)).toHaveText('All visitors')
    await expect(visitTimetablePage.schedulePrisoners(3)).toHaveText('All prisoners')

    await expect(visitTimetablePage.scheduleTime(4)).toHaveText('1:45pm to 3:45pm')
    await expect(visitTimetablePage.scheduleType(4)).toHaveText('Open')
    await expect(visitTimetablePage.scheduleCapacity(4)).toHaveText('40 tables')
    await expect(visitTimetablePage.scheduleVisitors(4)).toHaveText('Visitors aged 18 years old or older')
    await expect(visitTimetablePage.schedulePrisoners(4)).toContainText('Category A (High Risk)')

    await expect(visitTimetablePage.requestChangeLink).toHaveAttribute(
      'href',
      'https://request-changes-to-the-visits-timetable.form.service.justice.gov.uk/',
    )
  })

  test('should allow navigation between weeks and date selection', async ({ page }) => {
    await orchestrationApi.stubSessionSchedule({
      prisonId,
      date: format(today, shortDateFormat),
      includeExcludedSessions: false,
      sessionSchedule: [],
    })

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
      includeExcludedSessions: false,
      sessionSchedule: [],
    })
    await visitTimetablePage.goToNextWeek()
    await visitTimetablePage.checkSelectedDate(nextMon)

    // Navigate specific day
    const followingWeds = nextWednesday(nextMon)
    await orchestrationApi.stubSessionSchedule({
      prisonId,
      date: format(followingWeds, shortDateFormat),
      includeExcludedSessions: false,
      sessionSchedule: [],
    })
    await visitTimetablePage.goToDay(2)
    await visitTimetablePage.checkSelectedDate(followingWeds)

    // Navigate previous week
    const previousMon = previousMonday(nextMon)
    await orchestrationApi.stubSessionSchedule({
      prisonId,
      date: format(previousMon, shortDateFormat),
      includeExcludedSessions: false,
      sessionSchedule: [],
    })
    await visitTimetablePage.goToPreviousWeek()
    await visitTimetablePage.checkSelectedDate(previousMon)
  })
})
