import Page, { PageElement } from './page'

export default class SearchForABookingReferencePage extends Page {
  constructor() {
    super('Search for a booking')
  }

  enterVisitReference = (reference: string): void => {
    const blocks = reference.split('-')
    cy.get('#searchBlock1').clear().type(blocks[0])
    cy.get('#searchBlock2').clear().type(blocks[1])
    cy.get('#searchBlock3').clear().type(blocks[2])
    cy.get('#searchBlock4').clear().type(blocks[3])
  }

  continueButton = (): PageElement => cy.get('[data-test=search]')

  resultRow = (): PageElement => cy.get('.govuk-table__row')

  visitReferenceLink = (): PageElement => cy.get('.govuk-table__row > :nth-child(1) > a')

  searchByPrisonerLink = (): PageElement => cy.get('[data-test=search-by-prisoner]')
}
