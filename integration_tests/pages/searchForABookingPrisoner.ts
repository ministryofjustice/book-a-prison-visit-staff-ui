import Page, { PageElement } from './page'

export default class SearchForABookingPrisonerPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  enterVisitReference = (reference: string): void => {
    cy.get('#search').clear().type(reference)
  }

  continueButton = (): PageElement => cy.get('[data-test=search]')

  resultRow = (): PageElement => cy.get('.govuk-table__row')

  visitReferenceLink = (): PageElement => cy.get('.govuk-table__row > :nth-child(1) > a')

  searchByPrisonerLink = (): PageElement => cy.get('[data-test=search-by-prisoner]')

  prisonerLink = (): PageElement => cy.get('.govuk-table__row > :nth-child(1) > a')
}
