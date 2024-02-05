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
    }),
    TestData.sessionSchedule({
      sessionTemplateReference: '-cfe.dcc.0f',
      sessionTimeSlot: { startTime: '13:00', endTime: '14:00' },
      capacity: { open: 0, closed: 10 },
    }),
  ]

  const visits = [
    TestData.visitPreview(),
    TestData.visitPreview({
      prisonerId: 'B1234CD',
      firstName: 'FRED',
      lastName: 'JONES',
      visitReference: 'bc-de-ef-gh',
      visitorCount: 1,
    }),
  ]

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubFrontendComponents')
    cy.task('stubManageUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisonNames')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should show visits by date, view another session and change date to tomorrow', () => {
    cy.task('stubSessionSchedule', { prisonId, date: todayShortFormat, sessionSchedule })

    cy.task('stubGetVisitsBySessionTemplate', {
      reference: sessionSchedule[0].sessionTemplateReference,
      sessionDate: todayShortFormat,
      visitRestrictions: 'OPEN',
      visits,
    })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewVisitsTile().click()

    const visitsByDatePage = Page.verifyOnPage(VisitsByDatePage)

    // today, default (fist) session
    visitsByDatePage.dateTabsToday().contains(todayLongFormat)
    visitsByDatePage.dateTabsToday().should('have.attr', 'aria-current', 'page')
    visitsByDatePage.dateTabsTomorrow().contains(tomorrowLongFormat)

    visitsByDatePage.activeSessionNavLink().contains('1:45pm to 3:45pm')

    visitsByDatePage.visitSessionHeading().contains('Open visits, 1:45pm to 3:45pm')
    visitsByDatePage.tablesBookedCount().contains('2 of 40 tables booked')
    visitsByDatePage.visitorsTotalCount().contains('3 visitors')

    visitsByDatePage.prisonerName(1).contains('Smith, John')
    visitsByDatePage.prisonerNumber(1).contains('A1234BC')
    visitsByDatePage.prisonerName(2).contains('Jones, Fred')
    visitsByDatePage.prisonerNumber(2).contains('B1234CD')

    // select last closed session from side nav
    cy.task('stubGetVisitsBySessionTemplate', {
      reference: sessionSchedule[2].sessionTemplateReference,
      sessionDate: todayShortFormat,
      visitRestrictions: 'CLOSED',
      visits: [],
    })
    visitsByDatePage.selectSessionNavItem(3)

    visitsByDatePage.visitSessionHeading().contains('Closed visits, 1pm to 2pm')
    visitsByDatePage.tablesBookedCount().contains('0 of 10 tables booked')
    visitsByDatePage.visitorsTotalCount().should('not.exist')

    // select tomorrow
    cy.task('stubSessionSchedule', { prisonId, date: tomorrowShortFormat, sessionSchedule: [] })
    visitsByDatePage.dateTabsTomorrow().click()

    visitsByDatePage.dateTabsToday().should('not.have.attr', 'aria-current', 'page')
    visitsByDatePage.dateTabsTomorrow().should('have.attr', 'aria-current', 'page')

    visitsByDatePage.visitSessionHeading().should('not.exist')
    visitsByDatePage.tablesBookedCount().should('not.exist')
    visitsByDatePage.visitorsTotalCount().should('not.exist')
    visitsByDatePage.noResultsMessage().contains('No visit sessions on this day.')
  })

  it('should show visits by date, and change date using the date picker', () => {
    cy.task('stubSessionSchedule', { prisonId, date: todayShortFormat, sessionSchedule: [] })

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

    visitsByDatePage.toggleChooseAnotherDatePopUp()
    visitsByDatePage.datePickerGoToNextMonth()
    visitsByDatePage.datePickerSelectDay(1)
    visitsByDatePage.datePickerClickViewDate()
    visitsByDatePage.dateTabsToday().contains(firstOfNextMonthLongFormat)
    visitsByDatePage.noResultsMessage().contains('No visit sessions on this day')
  })
})
