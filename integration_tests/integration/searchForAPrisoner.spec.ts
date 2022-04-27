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

  context('when there is more than one page of results', () => {
    it('should list the results with paging', () => {
      const pageSize = 10
      const resultsPage1: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } = {
        totalPages: 2,
        totalElements: 11,
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
          {
            lastName: 'Last Name 3',
            firstName: 'First Name 3',
            prisonerNumber: 'DE1678F',
            dateOfBirth: '2000-01-03',
          },
          {
            lastName: 'Last Name 4',
            firstName: 'First Name 4',
            prisonerNumber: 'DE2678F',
            dateOfBirth: '2000-01-04',
          },
          {
            lastName: 'Last Name 5',
            firstName: 'First Name 5',
            prisonerNumber: 'DE3678F',
            dateOfBirth: '2000-01-05',
          },
          {
            lastName: 'Last Name 6',
            firstName: 'First Name 6',
            prisonerNumber: 'DE4678F',
            dateOfBirth: '2000-01-06',
          },
          {
            lastName: 'Last Name 7',
            firstName: 'First Name 7',
            prisonerNumber: 'DE6678F',
            dateOfBirth: '2000-01-07',
          },
          {
            lastName: 'Last Name 8',
            firstName: 'First Name 8',
            prisonerNumber: 'DE7678F',
            dateOfBirth: '2000-01-08',
          },
          {
            lastName: 'Last Name 9',
            firstName: 'First Name 9',
            prisonerNumber: 'DE8678F',
            dateOfBirth: '2000-01-09',
          },
          {
            lastName: 'Last Name 10',
            firstName: 'First Name 10',
            prisonerNumber: 'DE9678F',
            dateOfBirth: '2000-01-10',
          },
        ],
      }
      const resultsPage2: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } = {
        totalPages: 2,
        totalElements: 11,
        content: [
          {
            lastName: 'Last Name 11',
            firstName: 'First Name 11',
            prisonerNumber: 'DE9678G',
            dateOfBirth: '2000-01-11',
          },
        ],
      }
      cy.task('stubGetPrisoners', resultsPage1)
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
          searchForAPrisonerResultsPage.pagingLinks().should('exist')
          searchForAPrisonerResultsPage.resultRows().should('have.length', pageSize)

          resultsPage1.content.forEach((prisoner, index) => {
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

          cy.task('stubGetPrisoners', resultsPage2)
          searchForAPrisonerResultsPage.nextPageLink().click()
          searchForAPrisonerResultsPage.hasResults()
          searchForAPrisonerResultsPage.pagingLinks().should('exist')
          searchForAPrisonerResultsPage.resultRows().should('have.length', 1)

          searchForAPrisonerResultsPage
            .resultRows()
            .eq(0)
            .within(() => {
              cy.get('td').eq(0).contains(`${resultsPage2.content[0].lastName}, ${resultsPage2.content[0].firstName}`)
              cy.get('td').eq(1).contains(resultsPage2.content[0].prisonerNumber)
              cy.get('td')
                .eq(2)
                .contains(prisonerDatePretty({ dateToFormat: resultsPage2.content[0].dateOfBirth }))
            })
        })
    })
  })
})
