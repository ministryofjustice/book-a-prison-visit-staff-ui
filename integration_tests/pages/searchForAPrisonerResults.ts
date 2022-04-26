import Page, { PageElement } from './page'

export default class SearchForAPrisonerResultsPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  backLink = (): PageElement => cy.get('[class="govuk-back-link"]')

  searchForm = (): PageElement => cy.get('[action="/search/prisoner"]')

  searchInput = (): PageElement => cy.get('.moj-search__input')

  searchButton = (): PageElement => cy.get('.moj-search__button')

  noResults = (): PageElement => cy.get('#search-results-none')

  hasResults = (): PageElement => cy.get('#search-results-true')
}
