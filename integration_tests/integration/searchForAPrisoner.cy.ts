import HomePage from '../pages/home'
import Page from '../pages/page'
import SearchForAPrisonerPage from '../pages/searchForAPrisoner'
import SearchForAPrisonerResultsPage from '../pages/searchForAPrisonerResults'
import TestData from '../../server/routes/testutils/testData'

context('Search for a prisoner', () => {
  const { prisonerNumber } = TestData.prisoner()
  const prisoner = TestData.prisoner()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisonNames')
    cy.task('stubGetPrison', { prisonCode: 'HEI' })
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should show Search For A Prisoner page', () => {
    const homePage = Page.verifyOnPage(HomePage)
    homePage.bookAVisitTile().click()

    const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
    searchForAPrisonerPage.backLink()
    searchForAPrisonerPage.searchForm()
  })

  context('when there are no results', () => {
    it('should show that there are no results', () => {
      cy.task('stubPrisoners', { term: prisonerNumber })
      cy.task('stubPrisonerById', prisoner)

      const homePage = Page.verifyOnPage(HomePage)
      homePage.bookAVisitTile().click()

      const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
      searchForAPrisonerPage.searchInput().clear().type(prisonerNumber)
      searchForAPrisonerPage.searchButton().click()

      const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
      searchForAPrisonerResultsPage.noResults()
    })
  })

  context('when there is one page of results', () => {
    it('should list the results with no paging', () => {
      const searchTerm = 'name'
      const results = [
        TestData.prisoner(),
        TestData.prisoner({
          firstName: 'BOB',
          prisonerNumber: 'B1234CD',
          dateOfBirth: '2000-03-02',
        }),
      ]

      cy.task('stubPrisoners', {
        term: searchTerm,
        results: {
          totalElements: results.length,
          totalPages: 1,
          content: results,
        },
      })

      const homePage = Page.verifyOnPage(HomePage)
      homePage.bookAVisitTile().click()

      const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
      searchForAPrisonerPage.searchInput().clear().type(searchTerm)
      searchForAPrisonerPage.searchButton().click()

      const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
      searchForAPrisonerResultsPage.hasResults()
      searchForAPrisonerResultsPage.resultRows().should('have.length', results.length)
      searchForAPrisonerResultsPage.checkResultRows(results, searchTerm)
    })
  })

  context('when there is more than one page of results', () => {
    it('should list the results with paging', () => {
      const searchTerm = 'name'

      // 11 prisoner results: page of 10 and 1
      const resultsPage1 = Array(10)
        .fill({})
        .map((result, index) => {
          const resultNumber = (index + 1).toString().padStart(2, '0')
          return TestData.prisoner({
            firstName: `FORENAME_${resultNumber}`,
            lastName: `SURNAME_${resultNumber}`,
            prisonerNumber: `A10${resultNumber}BC`,
            dateOfBirth: `2000-05-${resultNumber}`,
          })
        })
      const resultsPage2 = [
        TestData.prisoner({
          firstName: 'FORENAME_11',
          lastName: 'SURNAME_11',
          prisonerNumber: 'A1011BC',
          dateOfBirth: '2000-05-11',
        }),
      ]

      cy.task('stubPrisoners', {
        term: searchTerm,
        results: {
          totalElements: 11,
          totalPages: 2,
          content: resultsPage1,
        },
      })

      const homePage = Page.verifyOnPage(HomePage)
      homePage.bookAVisitTile().click()

      const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
      searchForAPrisonerPage.searchInput().clear().type(searchTerm)
      searchForAPrisonerPage.searchButton().click()

      // results page 1
      const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
      searchForAPrisonerResultsPage.hasResults()
      searchForAPrisonerResultsPage.pagingLinks().should('exist')
      searchForAPrisonerResultsPage.resultRows().should('have.length', 10)
      searchForAPrisonerResultsPage.checkResultRows(resultsPage1, searchTerm)

      // results page 2
      cy.task('stubPrisoners', {
        term: searchTerm,
        results: {
          totalElements: 11,
          totalPages: 2,
          content: resultsPage2,
        },
        page: 1,
      })

      searchForAPrisonerResultsPage.nextPageLink().click()
      searchForAPrisonerResultsPage.hasResults()
      searchForAPrisonerResultsPage.pagingLinks().should('exist')
      searchForAPrisonerResultsPage.resultRows().should('have.length', 1)
      searchForAPrisonerResultsPage.checkResultRows(resultsPage2, searchTerm)
    })
  })
})
