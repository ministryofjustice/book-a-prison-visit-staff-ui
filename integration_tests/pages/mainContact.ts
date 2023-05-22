import Page, { PageElement } from './page'

export default class MainContactPage extends Page {
  constructor() {
    super('Who is the main contact for this booking?')
  }

  getFirstContact = (): PageElement => cy.get('#contact')

  enterPhoneNumber = (number: string): void => {
    cy.get('#phoneNumber').clear()
    cy.get('#phoneNumber').type(number)
  }

  getPhoneNumber = (): PageElement => cy.get('#phoneNumber')

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
