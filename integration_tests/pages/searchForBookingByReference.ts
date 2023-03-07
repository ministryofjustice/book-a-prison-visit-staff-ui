import Page, { PageElement } from './page'

export default class SearchForBookingByReferencePage extends Page {
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

  visitReference = (): PageElement => cy.get('[data-test=visit-reference]')

  visitReferenceLink = (): PageElement => cy.get('[data-test=visit-reference] > a')

  prisonerName = (): PageElement => cy.get('[data-test=prisoner-name]')

  prisonerNumber = (): PageElement => cy.get('[data-test=prisoner-number]')

  visitStatus = (): PageElement => cy.get('[data-test=visit-status]')

  searchByPrisonerLink = (): PageElement => cy.get('[data-test=search-by-prisoner]')
}
