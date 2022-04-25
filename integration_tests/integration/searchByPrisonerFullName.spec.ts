import IndexPage from '../pages/index'
import Page from '../pages/page'
import SearchForAPrisonerPage from '../pages/searchForAPrisoner'

context('Book A Visit page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
  })

  it('should show Search For A Prisoner page', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage
      .bookAVisitLink()
      .invoke('attr', 'href')
      .then(href => {
        cy.visit(href)

        const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
        searchForAPrisonerPage.backLink()
        searchForAPrisonerPage.searchForm()
      })
  })
})
