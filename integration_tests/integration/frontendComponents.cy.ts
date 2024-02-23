import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'

context('Frontend components', () => {
  const notificationCount = TestData.notificationCount()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisonNames')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', { notificationCount })
  })

  it('should render the footer from the frontend components', () => {
    cy.task('stubFrontendComponents')
    cy.signIn()

    Page.verifyOnPage(HomePage)
    cy.get('footer').contains('Footer component')
  })

  it('should render the fallback footer when frontend components load fails', () => {
    cy.task('stubFrontendComponentsFail')
    cy.signIn()

    Page.verifyOnPage(HomePage)
    cy.get('footer').should('not.contain.text', 'Footer component')
  })
})
