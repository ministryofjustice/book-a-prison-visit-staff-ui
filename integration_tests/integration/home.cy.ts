import HomePage from '../pages/home'
import Page from '../pages/page'

context('Home page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisons')
    cy.signIn()
  })

  it('should render the index page with the correct tiles', () => {
    const homePage = Page.verifyOnPage(HomePage)

    homePage.bookAVisitTile().contains('Book a visit')
    homePage.changeAVisitTile().contains('Change a visit')
    homePage.viewVisitsTile().contains('View visits by date')
    homePage.viewTimetableTile().contains('View visits timetable')
  })
})
