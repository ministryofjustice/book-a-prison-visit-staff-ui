import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'

context('Home page', () => {
  const notificationCount = TestData.notificationCount()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisonNames')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', { notificationCount })
    cy.signIn()
  })

  it('should render the index page with the correct tiles', () => {
    const homePage = Page.verifyOnPage(HomePage)

    homePage.bookAVisitTile().contains('Book a visit')
    homePage.changeAVisitTile().contains('Change a visit')
    homePage.needReviewTile().contains('Need review')
    homePage.needReviewBadgeCount().contains(notificationCount.count)
    homePage.viewVisitsTile().contains('View visits by date')
    homePage.viewTimetableTile().contains('View visits timetable')
  })
})
