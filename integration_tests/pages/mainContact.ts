import Page, { PageElement } from './page'

export default class MainContactPage extends Page {
  constructor() {
    super('Who is the main contact for this booking?')
  }

  getFirstContact = (): PageElement => cy.get('#contact')

  enterPhoneNumber = (number: string): void => {
    cy.get('#phoneNumber').clear().type(number)
  }

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
