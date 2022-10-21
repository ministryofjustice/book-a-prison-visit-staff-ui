import Page, { PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Manage prison visits')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  bookAVisitLink = (): PageElement => cy.get('[href="/search/prisoner"]')

  changeAVisitLink = (): PageElement => cy.get('[href="/search/visit"]')

  bookAVisitTile = (): PageElement => cy.get('[data-test="book-visit"]')

  changeAVisitTile = (): PageElement => cy.get('[data-test="change-visit"]')

  viewVisitsTile = (): PageElement => cy.get('[data-test="view-visits-by-date"]')
}
