import Page, { PageElement } from './page'

export default class SearchForBookingByPrisonerPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  enterSearchTerm = (term: string): void => {
    cy.get('#search').type(term)
  }

  continueButton = (): PageElement => cy.get('[data-test=search]')
}
