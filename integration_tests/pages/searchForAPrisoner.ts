import Page, { PageElement } from './page'

export default class SearchForAPrisonerPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  backLink = (): PageElement => cy.get('[href="/"]')

  searchForm = (): PageElement => cy.get('[action="/search/prisoner"]')
}
