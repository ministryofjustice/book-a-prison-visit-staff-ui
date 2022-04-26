import IndexPage from '../pages/index'
import Page from '../pages/page'
import SearchForAPrisonerPage from '../pages/searchForAPrisoner'
import SearchForAPrisonerResultsPage from '../pages/searchForAPrisonerResults'

context('Search for a prisoner', () => {
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

  context('when there are no results', () => {
    it('should show that there are no results', () => {
      cy.task('stubGetPrisoners')
      cy.signIn()
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage
        .bookAVisitLink()
        .invoke('attr', 'href')
        .then(href => {
          cy.visit(href)

          const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
          searchForAPrisonerPage.searchButton().click()

          const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
          searchForAPrisonerResultsPage.noResults()
        })
    })
  })
})
