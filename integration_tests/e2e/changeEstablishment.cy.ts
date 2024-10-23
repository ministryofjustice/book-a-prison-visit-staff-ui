import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import ChangeEstablishmentPage from '../pages/changeEstablishment'

context('Change establishment', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisonNames')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  // Check current establishment, change establishment and check again
  it.skip('Should change establishment and redirect to home page', () => {
    cy.task('stubUserCaseloads', TestData.caseLoads())
    cy.task('stubSetActiveCaseLoad', 'BLI')
    cy.task('stubGetNotificationCount', { prisonId: 'BLI' })

    let homePage = Page.verifyOnPage(HomePage)

    homePage.currentEstablishment().contains('Hewell (HMP)')
    homePage.changeEstablishmentLink().click()

    const changeEstablishmentPage = Page.verifyOnPage(ChangeEstablishmentPage)
    changeEstablishmentPage.selectEstablishment('BLI')
    cy.task('stubGetPrison', TestData.prisonDto({ code: 'BLI', prisonName: 'Bristol (HMP & YOI)' }))
    changeEstablishmentPage.continueButton().click()

    homePage = Page.verifyOnPage(HomePage)
    homePage.currentEstablishment().contains('Bristol (HMP & YOI)')
  })
})
