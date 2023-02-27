import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import ChangeEstablishmentPage from '../pages/changeEstablishment'

context('View visit schedule timetable', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisons')
    cy.signIn()
  })

  // navigate forwards a week, then back, then specific day - empty timetable
  it('Should change establishment', () => {
    cy.task('stubUserCaseloads', TestData.caseLoads())
    cy.task('stubSetActiveCaseLoad', 'BLI')

    // Home page - select View visit timetable
    let homePage = Page.verifyOnPage(HomePage)

    homePage.currentEstablishment().contains('Hewell (HMP)')
    homePage.changeEstablishmentLink().click()

    const changeEstablishmentPage = Page.verifyOnPage(ChangeEstablishmentPage)
    changeEstablishmentPage.selectEstablishment('BLI')
    changeEstablishmentPage.continueButton().click()
    cy.task('stubSetActiveCaseLoad', 'BLI')

    homePage = Page.verifyOnPage(HomePage)
    homePage.currentEstablishment().contains('Bristol (HMP & YOI)')
  })
})
