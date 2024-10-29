import TestData from '../../server/routes/testutils/testData'
import EstablishmentNotSupportedPage from '../pages/establishmentNotSupported'
import HomePage from '../pages/home'
import Page from '../pages/page'
import SearchForAPrisonerPage from '../pages/searchForAPrisoner'

context('Establishment not supported', () => {
  beforeEach(() => {
    cy.task('reset')
  })

  it('should render the establishment not supported page if user case load not supported', () => {
    cy.task('stubSignIn', { caseLoad: TestData.caseLoad({ caseLoadId: 'XYZ', description: 'XYZ (HMP)' }) })
    cy.task('stubSupportedPrisonIds')
    cy.signIn()

    Page.verifyOnPageTitle(EstablishmentNotSupportedPage, 'XYZ (HMP) does not use this service')
  })

  it('should redirect to establishment not supported page if case load changes from supported to unsupported', () => {
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()

    // Start on homepage - with user having a supported case load
    const homePage = Page.verifyOnPage(HomePage)

    // Start booking journey
    homePage.bookOrChangeVisitTile().click()
    const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)

    // User's active case load changes
    cy.task('stubSignIn', { caseLoad: TestData.caseLoad({ caseLoadId: 'XYZ', description: 'XYZ (HMP)' }) })

    // Attempt to search for a prisoner
    searchForAPrisonerPage.searchInput().type('smith')
    searchForAPrisonerPage.searchButton().click()

    // Redirected to establishment not supported page
    Page.verifyOnPageTitle(EstablishmentNotSupportedPage, 'XYZ (HMP) does not use this service')
  })
})
