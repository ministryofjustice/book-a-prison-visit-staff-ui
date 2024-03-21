import Page, { PageElement } from './page'

export default class SearchForAPrisonerPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  searchForm = (): PageElement => cy.get('[action="/search/prisoner/"]')

  searchInput = (): PageElement => cy.get('.moj-search__input')

  searchButton = (): PageElement => cy.get('.moj-search__button')
}
