import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('Manage prison visits')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  courtRegisterLink = (): PageElement => cy.get('[href="/court-register"]')
}
