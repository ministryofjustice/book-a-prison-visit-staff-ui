import { format, nextMonday, nextWednesday, previousMonday } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VisitTimetablePage from '../pages/visitTimetable'

context('View visit schedule timetable', () => {
  const prisonId = 'HEI'

  const shortDateFormat = 'yyyy-MM-dd'

  const today = new Date()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisons')
    cy.signIn()
  })

  it('should show the visits timetable with the current day selected', () => {
    const sessionSchedule = [
      TestData.sessionSchedule({
        startTime: '10:00',
        endTime: '11:30',
        enhanced: true,
        capacity: { open: 20, closed: 5 }, // will generate 2 session rows
        prisonerLocationGroupNames: ['Group 1', 'Group 2'],
        sessionTemplateFrequency: 'BI_WEEKLY',
      }),
      TestData.sessionSchedule(),
    ]
    cy.task('stubSessionSchedule', { prisonId, date: format(today, shortDateFormat), sessionSchedule })

    // Home page - select View visit timetable
    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewTimetableTile().click()

    // Visit timetable page
    const visitTimetablePage = Page.verifyOnPage(VisitTimetablePage)
    visitTimetablePage.backLink().should('have.attr', 'href', '/')
    visitTimetablePage.checkSelectedDate(today)

    visitTimetablePage.scheduleTime(0).contains('10am to 11:30am')
    visitTimetablePage.scheduleType(0).contains('Open')
    visitTimetablePage.scheduleCapacity(0).contains('20 tables')
    visitTimetablePage.scheduleAttendees(0).within(() => {
      cy.contains('Enhanced prisoners in:')
      cy.contains('Group 1')
      cy.contains('Group 2')
    })
    visitTimetablePage.scheduleFrequency(0).contains('Fortnightly')
    visitTimetablePage.scheduleEndDate(0).contains('Not entered')

    visitTimetablePage.scheduleTime(1).contains('10am to 11:30am')
    visitTimetablePage.scheduleType(1).contains('Closed')
    visitTimetablePage.scheduleCapacity(1).contains('5 tables')
    visitTimetablePage.scheduleAttendees(1).within(() => {
      cy.contains('Enhanced prisoners in:')
      cy.contains('Group 1')
      cy.contains('Group 2')
    })
    visitTimetablePage.scheduleFrequency(1).contains('Fortnightly')
    visitTimetablePage.scheduleEndDate(1).contains('Not entered')

    visitTimetablePage.scheduleTime(2).contains('1:45pm to 3:45pm')
    visitTimetablePage.scheduleType(2).contains('Open')
    visitTimetablePage.scheduleCapacity(2).contains('40 tables')
    visitTimetablePage.scheduleAttendees(2).contains('All prisoners')
    visitTimetablePage.scheduleFrequency(2).contains('Weekly')
    visitTimetablePage.scheduleEndDate(2).contains('Not entered')

    visitTimetablePage
      .requestChangeLink()
      .should('have.attr', 'href', 'https://request-changes-to-the-visits-timetable.form.service.justice.gov.uk/')
  })

  // navigate forwards a week, then back, then specific day - empty timetable
  it('should allow navigation between weeks and date selection', () => {
    cy.task('stubSessionSchedule', { prisonId, date: format(today, shortDateFormat), sessionSchedule: [] })

    // Home page - select View visit timetable
    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewTimetableTile().click()

    // Visit timetable page
    const visitTimetablePage = Page.verifyOnPage(VisitTimetablePage)
    visitTimetablePage.backLink().should('have.attr', 'href', '/')
    visitTimetablePage.checkSelectedDate(today)
    visitTimetablePage.emptySchedule().contains('No visit sessions on this day.')

    // Navigate dates
    const nextMon = nextMonday(today)
    cy.task('stubSessionSchedule', { prisonId, date: format(nextMon, shortDateFormat), sessionSchedule: [] })
    visitTimetablePage.goToNextWeek()
    visitTimetablePage.checkSelectedDate(nextMon)

    const followingWeds = nextWednesday(nextMon)
    cy.task('stubSessionSchedule', { prisonId, date: format(followingWeds, shortDateFormat), sessionSchedule: [] })
    visitTimetablePage.goToDay(2) // zero-indexed, so this is Weds
    visitTimetablePage.checkSelectedDate(followingWeds)

    const previousMon = previousMonday(nextMon)
    cy.task('stubSessionSchedule', { prisonId, date: format(previousMon, shortDateFormat), sessionSchedule: [] })
    visitTimetablePage.goToPreviousWeek()
    visitTimetablePage.checkSelectedDate(previousMon)
  })
})
