import { format } from 'date-fns'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VisitsByDatePage from '../pages/visitsByDate'

context('Date picker', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const today = new Date()
  const todayShortFormat = format(today, shortDateFormat)
  const prisonId = 'HEI'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisonNames')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.task('stubGetNotificationGroups', {})
    cy.signIn()

    cy.task('stubSessionSchedule', { prisonId, date: todayShortFormat, sessionSchedule: [] })
    cy.task('stubGetVisitsWithoutSessionTemplate', { prisonId, sessionDate: todayShortFormat, visits: [] })
  })

  it('should navigate through a range of dates and correctly handle month and year boundaries', () => {
    const homePage = Page.verifyOnPage(HomePage)
    cy.task('stubIsBlockedDate', { prisonId, excludeDate: todayShortFormat, prisonExcludeDates: [] })
    homePage.viewVisitsTile().click()
    const visitsByDatePage = Page.verifyOnPage(VisitsByDatePage)

    // open 'another date' form
    visitsByDatePage.toggleChooseAnotherDatePopUp()

    // go to date, move back a month then select same day number
    visitsByDatePage.datePicker.enterDate('5/10/2023')
    visitsByDatePage.datePicker.goToPreviousMonth()
    visitsByDatePage.datePicker.selectDay(5)
    visitsByDatePage.datePicker.getEnteredDate().should('have.value', '5/9/2023')

    // go to date, move back a month then select same day number
    visitsByDatePage.datePicker.enterDate('5/10/2023')
    visitsByDatePage.datePicker.goToNextMonth()
    visitsByDatePage.datePicker.selectDay(5)
    visitsByDatePage.datePicker.getEnteredDate().should('have.value', '5/11/2023')

    // go to date on 31st, move back to a month with 30 days; select 1st and should be previous month
    visitsByDatePage.datePicker.enterDate('31/10/2023')
    visitsByDatePage.datePicker.goToPreviousMonth()
    visitsByDatePage.datePicker.selectDay(1)
    visitsByDatePage.datePicker.getEnteredDate().should('have.value', '1/9/2023')

    // go to date on 31st, move forward to a month with 30 days; select 1st and should be next month
    visitsByDatePage.datePicker.enterDate('31/10/2023')
    visitsByDatePage.datePicker.goToNextMonth()
    visitsByDatePage.datePicker.selectDay(1)
    visitsByDatePage.datePicker.getEnteredDate().should('have.value', '1/11/2023')

    // handle leap year - when moving back a year
    visitsByDatePage.datePicker.enterDate('29/2/2024')
    visitsByDatePage.datePicker.goToPreviousYear()
    visitsByDatePage.datePicker.selectDay(1)
    visitsByDatePage.datePicker.getEnteredDate().should('have.value', '1/2/2023')

    // handle leap year - when moving forward a year
    visitsByDatePage.datePicker.enterDate('29/2/2024')
    visitsByDatePage.datePicker.goToNextYear()
    visitsByDatePage.datePicker.selectDay(1)
    visitsByDatePage.datePicker.getEnteredDate().should('have.value', '1/2/2025')

    // handle months where the 1st is a Sunday (i.e not truncate this date)
    visitsByDatePage.datePicker.enterDate('1/10/2023')
    visitsByDatePage.datePicker.selectDay(1)
    visitsByDatePage.datePicker.getEnteredDate().should('have.value', '1/10/2023')
  })
})
