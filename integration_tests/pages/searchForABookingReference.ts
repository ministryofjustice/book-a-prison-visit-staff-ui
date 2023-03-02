import Page, { PageElement } from './page'

export default class SearchForABookingReferencePage extends Page {
  constructor() {
    super('Search for a booking')
  }

  enterReferenceBlockOne = (number: string): void => {
    cy.get('#searchBlock1').clear().type(number)
  }

  enterReferenceBlockTwo = (number: string): void => {
    cy.get('#searchBlock2').clear().type(number)
  }

  enterReferenceBlockThree = (number: string): void => {
    cy.get('#searchBlock3').clear().type(number)
  }

  enterReferenceBlockFour = (number: string): void => {
    cy.get('#searchBlock4').clear().type(number)
  }

  continueButton = (): PageElement => cy.get('[data-test=search]')

  resultRow = (): PageElement => cy.get('.govuk-table__row')

  visitReferenceLink = (): PageElement => cy.get('.govuk-table__row > :nth-child(1) > a')
}
