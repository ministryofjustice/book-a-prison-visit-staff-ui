import { format, add } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VisitsByDatePage from '../pages/visitsByDate'

context('View visits by date', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  const today = new Date()
  const todayShortFormat = format(today, shortDateFormat)
  const todayLongFormat = format(today, longDateFormat)
  const tomorrowShortFormat = format(add(today, { days: 1 }), shortDateFormat)
  const tomorrowLongFormat = format(add(today, { days: 1 }), longDateFormat)

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
    }),
  ]

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should show visits by date, view another session and change date to tomorrow', () => {
    cy.task('stubSessionSchedule', { prisonId, date: todayShortFormat, sessionSchedule })

    cy.task('stubGetVisitsBySessionTemplate', {
      prisonId,
      reference: sessionSchedule[0].sessionTemplateReference,
      sessionDate: todayShortFormat,
      visits,
    })

    cy.task('stubGetVisitsWithoutSessionTemplate', { prisonId, sessionDate: todayShortFormat, visits: [] })
    cy.task('stubIsBlockedDate', { prisonId, excludeDate: todayShortFormat })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewVisitsTile().click()

    const visitsByDatePage = Page.verifyOnPage(VisitsByDatePage)

    // today, default (first) session
    visitsByDatePage.dateTabsToday().contains(todayLongFormat)
    visitsByDatePage.dateTabsToday().should('have.attr', 'aria-current', 'page')
    visitsByDatePage.dateTabsTomorrow().contains(tomorrowLongFormat)

    visitsByDatePage.activeSessionNavLink().contains('1:45pm to 3:45pm')

    visitsByDatePage.visitSessionHeading().contains('Visits from 1:45pm to 3:45pm')
    visitsByDatePage.visitSectionHeading('open').contains('Open visits')
    visitsByDatePage.tablesBookedCount('open').contains('2 of 40 tables booked')
    visitsByDatePage.visitorsTotalCount('open').contains('3 visitors')

    // visits with default sort (last booked first)
    visitsByDatePage.prisonerName(1).contains('Smith, John')
    visitsByDatePage.prisonerNumber(1).contains('A1234BC')
    visitsByDatePage.bookedOn(1).contains('2 January at 2:30pm')
    visitsByDatePage.prisonerName(2).contains('Jones, Fred')
    visitsByDatePage.prisonerNumber(2).contains('B1234CD')
    visitsByDatePage.bookedOn(2).contains('1 January at 9am')

    // Click 'Booked on' header to sort and show first booked first
    visitsByDatePage.bookedOnHeader().click()

    // Visits should be re-ordered
    visitsByDatePage.prisonerName(1).contains('Jones, Fred')
    visitsByDatePage.prisonerNumber(1).contains('B1234CD')
    visitsByDatePage.bookedOn(1).contains('1 January at 9am')
    visitsByDatePage.prisonerName(2).contains('Smith, John')
    visitsByDatePage.prisonerNumber(2).contains('A1234BC')
    visitsByDatePage.bookedOn(2).contains('2 January at 2:30pm')

    // select last session from side nav
    cy.task('stubGetVisitsBySessionTemplate', {
      prisonId,
      reference: sessionSchedule[2].sessionTemplateReference,
      sessionDate: todayShortFormat,
      visits: [],
    })
    visitsByDatePage.selectSessionNavItem(2)

    visitsByDatePage.visitSessionHeading().contains('Visits from 1pm to 2pm')
    visitsByDatePage.visitSectionHeading('closed').contains('Closed visits')
    visitsByDatePage.tablesBookedCount('closed').contains('0 of 10 tables booked')
    visitsByDatePage.visitorsTotalCount('closed').should('not.exist')

    // select tomorrow
    cy.task('stubSessionSchedule', { prisonId, date: tomorrowShortFormat, sessionSchedule: [] })
    cy.task('stubGetVisitsWithoutSessionTemplate', { prisonId, sessionDate: tomorrowShortFormat, visits: [] })
    cy.task('stubIsBlockedDate', { prisonId, excludeDate: tomorrowShortFormat, excludeDates: null })

    visitsByDatePage.dateTabsTomorrow().click()

    visitsByDatePage.dateTabsToday().should('not.have.attr', 'aria-current', 'page')
    visitsByDatePage.dateTabsTomorrow().should('have.attr', 'aria-current', 'page')

    visitsByDatePage.visitSessionHeading().should('not.exist')
    visitsByDatePage.visitSectionHeading('open').should('not.exist')
    visitsByDatePage.visitSectionHeading('closed').should('not.exist')
    visitsByDatePage.tablesBookedCount('open').should('not.exist')
    visitsByDatePage.tablesBookedCount('closed').should('not.exist')
    visitsByDatePage.visitorsTotalCount('open').should('not.exist')
    visitsByDatePage.visitorsTotalCount('closed').should('not.exist')
    visitsByDatePage.noResultsMessage().contains('No visit sessions on this day.')
  })

  it('should show visits by date for migrated visits with no session templates', () => {
    cy.task('stubSessionSchedule', { prisonId, date: todayShortFormat, sessionSchedule: [] })
    const anotherVisit = TestData.visitPreview({ visitTimeSlot: { startTime: '09:00', endTime: '10:00' } })
    cy.task('stubGetVisitsWithoutSessionTemplate', {
      prisonId,
      sessionDate: todayShortFormat,
      visits: [...visits, anotherVisit],
    })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewVisitsTile().click()

    const visitsByDatePage = Page.verifyOnPage(VisitsByDatePage)

    // today, default (first) 'unknown' session
    visitsByDatePage.dateTabsToday().contains(todayLongFormat)
    visitsByDatePage.dateTabsToday().should('have.attr', 'aria-current', 'page')
    visitsByDatePage.dateTabsTomorrow().contains(tomorrowLongFormat)

    visitsByDatePage.activeSessionNavLink().contains('9am to 10am')

    visitsByDatePage.visitSessionHeading().contains('Visits from 9am to 10am')
    visitsByDatePage.visitSectionHeading('unknown').contains('All visits')
    visitsByDatePage.tablesBookedCount('unknown').contains('1 table booked')
    visitsByDatePage.visitorsTotalCount('unknown').contains('2 visitors')

    visitsByDatePage.prisonerName(1).contains('Smith, John')
    visitsByDatePage.prisonerNumber(1).contains('A1234BC')
    visitsByDatePage.bookedOn(1).contains('1 January at 9am')

    // select the second 'unknown' visits session
    visitsByDatePage.selectSessionNavItem(1)
    visitsByDatePage.dateTabsToday().contains(todayLongFormat)
    visitsByDatePage.dateTabsToday().should('have.attr', 'aria-current', 'page')
    visitsByDatePage.dateTabsTomorrow().contains(tomorrowLongFormat)

    visitsByDatePage.activeSessionNavLink().contains('1:45pm to 3:45pm')

    visitsByDatePage.visitSessionHeading().contains('Visits from 1:45pm to 3:45pm')
    visitsByDatePage.visitSectionHeading('unknown').contains('All visits')
    visitsByDatePage.tablesBookedCount('unknown').contains('2 tables booked')
    visitsByDatePage.visitorsTotalCount('unknown').contains('3 visitors')

    visitsByDatePage.prisonerName(1).contains('Smith, John')
    visitsByDatePage.prisonerNumber(1).contains('A1234BC')
    visitsByDatePage.bookedOn(1).contains('2 January at 2:30pm')
    visitsByDatePage.prisonerName(2).contains('Jones, Fred')
    visitsByDatePage.prisonerNumber(2).contains('B1234CD')
    visitsByDatePage.bookedOn(2).contains('1 January at 9am')
  })

  it('should show visits by date, and change date using the date picker', () => {
    cy.task('stubSessionSchedule', { prisonId, date: todayShortFormat, sessionSchedule: [] })
    cy.task('stubGetVisitsWithoutSessionTemplate', { prisonId, sessionDate: todayShortFormat, visits: [] })
    cy.task('stubIsBlockedDate', { prisonId, excludeDate: todayShortFormat, excludeDates: null })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewVisitsTile().click()

    const visitsByDatePage = Page.verifyOnPage(VisitsByDatePage)
    visitsByDatePage.dateTabsToday().contains(todayLongFormat)
    visitsByDatePage.dateTabsToday().should('have.attr', 'aria-current', 'page')
    visitsByDatePage.noResultsMessage().contains('No visit sessions on this day')

    // choose another date - open picker, go to next month and choose 1st
    const firstOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const firstOfNextMonthShortFormat = format(firstOfNextMonth, shortDateFormat)
    const firstOfNextMonthLongFormat = format(firstOfNextMonth, longDateFormat)
    cy.task('stubSessionSchedule', { prisonId, date: firstOfNextMonthShortFormat, sessionSchedule: [] })
    cy.task('stubGetVisitsWithoutSessionTemplate', { prisonId, sessionDate: firstOfNextMonthShortFormat, visits: [] })
    cy.task('stubIsBlockedDate', { prisonId, excludeDate: firstOfNextMonthShortFormat, excludeDates: null })

    visitsByDatePage.toggleChooseAnotherDatePopUp()
    visitsByDatePage.datePicker.goToNextMonth()
    visitsByDatePage.datePicker.selectDay(1)
    visitsByDatePage.viewSelectedDate()
    visitsByDatePage.dateTabsToday().contains(firstOfNextMonthLongFormat)
    visitsByDatePage.noResultsMessage().contains('No visit sessions on this day')
  })
})
