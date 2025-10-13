import Page from '../page'

export default class BookerSearchPage extends Page {
  constructor() {
    super('Manage online bookers')
  }

  enterEmail = (email: string): void => {
    cy.get('input#search').type(email)
  }

  search = (): void => {
    cy.get('[data-test="search"]').click()
  }
}
