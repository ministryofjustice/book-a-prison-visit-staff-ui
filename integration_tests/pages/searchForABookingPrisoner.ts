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

  visitReference = (): PageElement => cy.get('[data-test="visit-reference-1"]')

  visitReferenceLink = (): PageElement => cy.get('[data-test="visit-reference-1"] > a')

  mainContact = (): PageElement => cy.get('[data-test="visit-mainContact-1"]')

  visitDate = (): PageElement => cy.get('[data-test="visit-date-1"]')

  visitStatus = (): PageElement => cy.get('[data-test="visit-status-1"]')

  searchByPrisonerLink = (): PageElement => cy.get('[data-test=search-by-prisoner]')

  prisonerLink = (): PageElement => cy.get('.govuk-table__row > :nth-child(1) > a')
}
