import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('Manage prison visits')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  bookAVisitLink = (): PageElement => cy.get('[href="/search/prisoner"]')

  changeAVisitLink = (): PageElement => cy.get('[href="/search/visit"]')
}
