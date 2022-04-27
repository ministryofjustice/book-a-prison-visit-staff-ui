import IndexPage from '../pages/index'
import Page from '../pages/page'
import SearchForAPrisonerPage from '../pages/searchForAPrisoner'
import SearchForAPrisonerResultsPage from '../pages/searchForAPrisonerResults'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'
import { prisonerDatePretty } from '../../server/utils/utils'

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
      const results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } = {
        totalPages: 0,
        totalElements: 0,
        content: [],
      }
      cy.task('stubGetPrisoners', results)
      cy.signIn()
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage
        .bookAVisitLink()
        .invoke('attr', 'href')
        .then(href => {
          cy.visit(href)

          const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
          searchForAPrisonerPage.searchInput().clear().type('AB1234C')
          searchForAPrisonerPage.searchButton().click()

          const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
          searchForAPrisonerResultsPage.noResults()
        })
    })
  })

  context('when there is one page of results', () => {
    it('should list the results with no paging', () => {
      const results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } = {
        totalPages: 1,
        totalElements: 2,
        content: [
          {
            lastName: 'Last Name 1',
            firstName: 'First Name 1',
            prisonerNumber: 'AB1234C',
            dateOfBirth: '2000-01-01',
          },
          {
            lastName: 'Last Name 2',
            firstName: 'First Name 2',
            prisonerNumber: 'DE5678F',
            dateOfBirth: '2000-01-02',
          },
        ],
      }
      cy.task('stubGetPrisoners', results)
      cy.signIn()
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage
        .bookAVisitLink()
        .invoke('attr', 'href')
        .then(href => {
          cy.visit(href)

          const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
          searchForAPrisonerPage.searchInput().clear().type('AB1234C')
          searchForAPrisonerPage.searchButton().click()

          const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
          searchForAPrisonerResultsPage.hasResults()
          searchForAPrisonerResultsPage.pagingLinks().should('not.exist')
          searchForAPrisonerResultsPage.resultRows().should('have.length', results.content.length)

          results.content.forEach((prisoner, index) => {
            searchForAPrisonerResultsPage
              .resultRows()
              .eq(index)
              .within(() => {
                cy.get('td').eq(0).contains(`${prisoner.lastName}, ${prisoner.firstName}`)
                cy.get('td').eq(1).contains(prisoner.prisonerNumber)
                cy.get('td')
                  .eq(2)
                  .contains(prisonerDatePretty({ dateToFormat: prisoner.dateOfBirth }))
              })
          })
        })
    })
  })
})
