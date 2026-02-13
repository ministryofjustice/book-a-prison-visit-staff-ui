import { test, expect } from '@playwright/test'
import { format, addDays } from 'date-fns'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages-playwright/homePage'
import VisitsByDatePage from '../../pages-playwright/visitsByDate/visitsByDatePage'
import TestData from '../../../server/routes/testutils/testData'

test.describe('View visits by date', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'
  const today = new Date()
  const tomorrow = addDays(today, 1)
  const todayShortFormat = format(today, shortDateFormat)
  const todayLongFormat = format(today, longDateFormat)
  const tomorrowShortFormat = format(tomorrow, shortDateFormat)
  const tomorrowLongFormat = format(tomorrow, longDateFormat)
  const prisonId = 'HEI'

  const sessionSchedule = [
    TestData.sessionSchedule(),
    TestData.sessionSchedule({
      sessionTemplateReference: '-bfe.dcc.0f',
      sessionTimeSlot: { startTime: '10:00', endTime: '11:00' },
      capacity: { open: 20, closed: 5 },
      visitRoom: 'Visits hall 2',
    }),
    TestData.sessionSchedule({
      sessionTemplateReference: '-cfe.dcc.0f',
      sessionTimeSlot: { startTime: '13:00', endTime: '14:00' },
      capacity: { open: 0, closed: 10 },
      visitRoom: 'Visits hall 2',
    }),
  ]

  const visits = [
    TestData.visitPreview({ firstBookedDateTime: '2022-01-02T14:30:00' }),
    TestData.visitPreview({
      prisonerId: 'B1234CD',
      firstName: 'FRED',
      lastName: 'JONES',
      visitReference: 'bc-de-ef-gh',
      visitorCount: 1,
      firstBookedDateTime: '2022-01-01T09:00:00',
      visitSubStatus: 'REQUESTED',
    }),
  ]

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
    await login(page)
  })

  test('should show visits by date, view another session and change date to tomorrow', async ({ page }) => {
    // --- Stub sessions & visits ---
    await orchestrationApi.stubSessionSchedule({ prisonId, date: todayShortFormat, sessionSchedule })
    await orchestrationApi.stubGetVisitsBySessionTemplate({
      prisonId,
      reference: sessionSchedule[0].sessionTemplateReference,
      sessionDate: todayShortFormat,
      visits,
    })
    await orchestrationApi.stubGetVisitsWithoutSessionTemplate({ prisonId, sessionDate: todayShortFormat, visits: [] })
    await orchestrationApi.stubIsBlockedDate({ prisonId, excludeDate: todayShortFormat, excludeDates: [] })

    // --- Navigate to page ---
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.viewVisitsTile.click()
    const visitsByDatePage = await VisitsByDatePage.verifyOnPage(page)

    // --- Today tab ---
    await expect(visitsByDatePage.dateTabsToday).toContainText(todayLongFormat)
    await expect(visitsByDatePage.dateTabsTomorrow).toContainText(tomorrowLongFormat)

    await expect(visitsByDatePage.visitSessionHeading).toContainText('Visits from 1:45pm to 3:45pm')
    await expect(visitsByDatePage.visitSectionHeading('open')).toContainText('Open visits')
    await expect(visitsByDatePage.tablesBookedCount('open')).toContainText('2 of 40 tables reserved')
    await expect(visitsByDatePage.visitorsTotalCount('open')).toContainText('3 visitors')

    await expect(visitsByDatePage.prisonerName(0)).toContainText('Smith, John')
    await expect(visitsByDatePage.prisonerNumber(0)).toContainText('A1234BC')
    await expect(visitsByDatePage.bookedOn(0)).toContainText('2 January at 2:30pm')
    await expect(visitsByDatePage.visitStatus(0)).toContainText('Booked')

    await expect(visitsByDatePage.prisonerName(1)).toContainText('Jones, Fred')
    await expect(visitsByDatePage.prisonerNumber(1)).toContainText('B1234CD')
    await expect(visitsByDatePage.bookedOn(1)).toContainText('1 January at 9am')
    await expect(visitsByDatePage.visitStatus(1)).toContainText('Requested')

    // --- Sort by "Booked on" ---
    await visitsByDatePage.bookedOnHeader.click()
    await expect(visitsByDatePage.prisonerName(0)).toContainText('Jones, Fred')
    await expect(visitsByDatePage.prisonerName(1)).toContainText('Smith, John')

    // --- Select last session ---
    await orchestrationApi.stubGetVisitsBySessionTemplate({
      prisonId,
      reference: sessionSchedule[2].sessionTemplateReference,
      sessionDate: todayShortFormat,
      visits: [],
    })
    await visitsByDatePage.selectSessionNavItem(2).click()
    await expect(visitsByDatePage.visitSessionHeading).toContainText('Visits from 1pm to 2pm')
    await expect(visitsByDatePage.visitSectionHeading('closed')).toContainText('Closed visits')
    await expect(visitsByDatePage.tablesBookedCount('closed')).toContainText('0 of 10 tables reserved')
    await expect(visitsByDatePage.visitorsTotalCount('closed')).toHaveCount(0)

    // --- Switch to tomorrow ---
    await orchestrationApi.stubSessionSchedule({ prisonId, date: tomorrowShortFormat, sessionSchedule: [] })
    await orchestrationApi.stubGetVisitsWithoutSessionTemplate({
      prisonId,
      sessionDate: tomorrowShortFormat,
      visits: [],
    })
    await orchestrationApi.stubIsBlockedDate({ prisonId, excludeDate: tomorrowShortFormat, excludeDates: [] })

    await visitsByDatePage.dateTabsTomorrow.click()
    await expect(visitsByDatePage.visitSessionHeading).toHaveCount(0)
    await expect(visitsByDatePage.visitSectionHeading('open')).toHaveCount(0)
    await expect(visitsByDatePage.visitSectionHeading('closed')).toHaveCount(0)
    await expect(visitsByDatePage.tablesBookedCount('open')).toHaveCount(0)
    await expect(visitsByDatePage.tablesBookedCount('closed')).toHaveCount(0)
    await expect(visitsByDatePage.visitorsTotalCount('open')).toHaveCount(0)
    await expect(visitsByDatePage.visitorsTotalCount('closed')).toHaveCount(0)
    await expect(visitsByDatePage.noResultsMessage).toContainText('No visit sessions on this day.')
  })

  test('should show visits by date for migrated visits with no session templates', async ({ page }) => {
    await orchestrationApi.stubSessionSchedule({ prisonId, date: todayShortFormat, sessionSchedule: [] })
    const anotherVisit = TestData.visitPreview({ visitTimeSlot: { startTime: '09:00', endTime: '10:00' } })
    await orchestrationApi.stubGetVisitsWithoutSessionTemplate({
      prisonId,
      sessionDate: todayShortFormat,
      visits: [...visits, anotherVisit],
    })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.viewVisitsTile.click()
    const visitsByDatePage = await VisitsByDatePage.verifyOnPage(page)

    // first 'unknown' session
    await expect(visitsByDatePage.dateTabsToday).toContainText(todayLongFormat)
    await expect(visitsByDatePage.dateTabsTomorrow).toContainText(tomorrowLongFormat)
    await expect(visitsByDatePage.activeSessionNavLink).toContainText('9am to 10am')
    await expect(visitsByDatePage.visitSessionHeading).toContainText('Visits from 9am to 10am')
    await expect(visitsByDatePage.visitSectionHeading('unknown')).toContainText('All visits')
    await expect(visitsByDatePage.tablesBookedCount('unknown')).toContainText('1 table reserved')
    await expect(visitsByDatePage.visitorsTotalCount('unknown')).toContainText('2 visitors')

    await expect(visitsByDatePage.prisonerName(0)).toContainText('Smith, John')
    await expect(visitsByDatePage.prisonerNumber(0)).toContainText('A1234BC')
    await expect(visitsByDatePage.bookedOn(0)).toContainText('1 January at 9am')
    await expect(visitsByDatePage.visitStatus(0)).toContainText('Booked')

    // second 'unknown' session
    await visitsByDatePage.selectSessionNavItem(1).click()
    await expect(visitsByDatePage.activeSessionNavLink).toContainText('1:45pm to 3:45pm')
    await expect(visitsByDatePage.visitSessionHeading).toContainText('Visits from 1:45pm to 3:45pm')
    await expect(visitsByDatePage.visitSectionHeading('unknown')).toContainText('All visits')
    await expect(visitsByDatePage.tablesBookedCount('unknown')).toContainText('2 tables reserved')
    await expect(visitsByDatePage.visitorsTotalCount('unknown')).toContainText('3 visitors')

    await expect(visitsByDatePage.prisonerName(0)).toContainText('Smith, John')
    await expect(visitsByDatePage.prisonerNumber(0)).toContainText('A1234BC')
    await expect(visitsByDatePage.bookedOn(0)).toContainText('2 January at 2:30pm')
    await expect(visitsByDatePage.visitStatus(0)).toContainText('Booked')
    await expect(visitsByDatePage.prisonerName(1)).toContainText('Jones, Fred')
    await expect(visitsByDatePage.prisonerNumber(1)).toContainText('B1234CD')
    await expect(visitsByDatePage.bookedOn(1)).toContainText('1 January at 9am')
    await expect(visitsByDatePage.visitStatus(1)).toContainText('Requested')
  })

  test('should show visits by date, and change date using the date picker', async ({ page }) => {
    await orchestrationApi.stubSessionSchedule({ prisonId, date: todayShortFormat, sessionSchedule: [] })
    await orchestrationApi.stubGetVisitsWithoutSessionTemplate({ prisonId, sessionDate: todayShortFormat, visits: [] })
    await orchestrationApi.stubIsBlockedDate({ prisonId, excludeDate: todayShortFormat, excludeDates: null })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.viewVisitsTile.click()
    const visitsByDatePage = await VisitsByDatePage.verifyOnPage(page)

    await expect(visitsByDatePage.dateTabsToday).toContainText(todayLongFormat)
    await expect(visitsByDatePage.noResultsMessage).toContainText('No visit sessions on this day')

    const firstOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const firstOfNextMonthShortFormat = format(firstOfNextMonth, shortDateFormat)
    const firstOfNextMonthLongFormat = format(firstOfNextMonth, longDateFormat)

    await orchestrationApi.stubSessionSchedule({ prisonId, date: firstOfNextMonthShortFormat, sessionSchedule: [] })
    await orchestrationApi.stubGetVisitsWithoutSessionTemplate({
      prisonId,
      sessionDate: firstOfNextMonthShortFormat,
      visits: [],
    })
    await orchestrationApi.stubIsBlockedDate({ prisonId, excludeDate: firstOfNextMonthShortFormat, excludeDates: null })

    await visitsByDatePage.toggleChooseAnotherDatePopUp()
    await visitsByDatePage.datePicker.goToNextMonth()
    await visitsByDatePage.datePicker.selectDay(1)
    await visitsByDatePage.viewSelectedDate()

    await expect(visitsByDatePage.dateTabsToday).toContainText(firstOfNextMonthLongFormat)
    await expect(visitsByDatePage.noResultsMessage).toContainText('No visit sessions on this day')
  })
})
