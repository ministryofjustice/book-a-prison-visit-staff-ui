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
    cy.signIn()

    const startDateTime = `${todayShortFormat}T00:00:00`
    const endDateTime = `${todayShortFormat}T23:59:59`
    cy.task('stubVisitsByDate', {
      startDateTime,
      endDateTime,
      prisonId,
      visits: [],
    })
  })

  it('should navigate through a range of dates and correctly handle month and year boundaries', () => {
    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewVisitsTile().click()
    const visitsByDatePage = Page.verifyOnPage(VisitsByDatePage)

    // open 'another date' form
    visitsByDatePage.toggleChooseAnotherDatePopUp()

    // go to date, move back a month then select same day number
    visitsByDatePage.datePickerEnterDate('05/10/2023')
    visitsByDatePage.datePickerGoToPreviousMonth()
    visitsByDatePage.datePickerSelectDay(5)
    visitsByDatePage.datePickerGetEnteredDate().should('have.value', '05/09/2023')

    // go to date, move back a month then select same day number
    visitsByDatePage.datePickerEnterDate('05/10/2023')
    visitsByDatePage.datePickerGoToNextMonth()
    visitsByDatePage.datePickerSelectDay(5)
    visitsByDatePage.datePickerGetEnteredDate().should('have.value', '05/11/2023')

    // go to date on 31st, move back to a month with 30 days; select 1st and should be previous month
    visitsByDatePage.datePickerEnterDate('31/10/2023')
    visitsByDatePage.datePickerGoToPreviousMonth()
    visitsByDatePage.datePickerSelectDay(1)
    visitsByDatePage.datePickerGetEnteredDate().should('have.value', '01/09/2023')

    // go to date on 31st, move forward to a month with 30 days; select 1st and should be next month
    visitsByDatePage.datePickerEnterDate('31/10/2023')
    visitsByDatePage.datePickerGoToNextMonth()
    visitsByDatePage.datePickerSelectDay(1)
    visitsByDatePage.datePickerGetEnteredDate().should('have.value', '01/11/2023')

    // handle leap year - when moving back a year
    visitsByDatePage.datePickerEnterDate('29/02/2024')
    visitsByDatePage.datePickerGoToPreviousYear()
    visitsByDatePage.datePickerSelectDay(1)
    visitsByDatePage.datePickerGetEnteredDate().should('have.value', '01/02/2023')

    // handle leap year - when moving forward a year
    visitsByDatePage.datePickerEnterDate('29/02/2024')
    visitsByDatePage.datePickerGoToNextYear()
    visitsByDatePage.datePickerSelectDay(1)
    visitsByDatePage.datePickerGetEnteredDate().should('have.value', '01/02/2025')

    // handle months where the 1st is a Sunday (i.e not truncate this date)
    visitsByDatePage.datePickerEnterDate('01/10/2023')
    visitsByDatePage.datePickerSelectDay(1)
    visitsByDatePage.datePickerGetEnteredDate().should('have.value', '01/10/2023')
  })
})
