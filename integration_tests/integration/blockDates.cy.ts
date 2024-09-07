import HomePage from '../pages/home'
import Page from '../pages/page'
import BlockedVisitPage from '../pages/blockedVisits'
import TestData from '../../server/routes/testutils/testData'

context('Block dates', () => {
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

  it('Should load block dates page, and display blocked dates', () => {
    cy.task('stubUserCaseloads', TestData.caseLoads())
    cy.task('stubSetActiveCaseLoad', 'HEI')
    cy.task('stubGetNotificationCount', { prisonId: 'HEI' })

    cy.task('stubGetFutureBlockedDates', { prisonId: 'HEI' })

    const homePage = Page.verifyOnPage(HomePage)

    homePage.blockedDatesTile().click()

    const blockedVisitPage = Page.verifyOnPage(BlockedVisitPage)
    blockedVisitPage.blockedDate(1).contains('Thursday 12 December 2024')
    blockedVisitPage.blockedBy(1).contains('User one')
    blockedVisitPage.unblockLink(1).should('have.attr', 'href', `/unblock`)
  })
})
