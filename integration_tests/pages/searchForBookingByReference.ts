import Page, { PageElement } from './page'

export default class SearchForBookingByReferencePage extends Page {
  constructor() {
    super('Search for a booking')
  }

  enterVisitReference = (reference: string): void => {
    const blocks = reference.split('-')
    cy.get('#searchBlock1').type(blocks[0])
    cy.get('#searchBlock2').type(blocks[1])
    cy.get('#searchBlock3').type(blocks[2])
    cy.get('#searchBlock4').type(blocks[3])
  }

  continueButton = (): PageElement => cy.get('[data-test=search]')

  searchByPrisonerLink = (): PageElement => cy.get('[data-test=search-by-prisoner]')
}
