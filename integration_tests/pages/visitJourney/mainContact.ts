import Page, { PageElement } from '../page'

export default class MainContactPage extends Page {
  constructor() {
    super('Who is the main contact for this booking?', {
      // Known issue with radio conditional reveal. See:
      // https://github.com/alphagov/govuk-frontend/issues/979
      axeRulesToIgnore: ['aria-allowed-attr'],
    })
  }

  getFirstContact = (): PageElement => cy.get('#contact')

  phoneNumberTrueRadio = (): PageElement => cy.get('#phoneNumber')

  enterPhoneNumber = (number: string): void => {
    cy.get('#phoneNumberInput').clear()
    cy.get('#phoneNumberInput').type(number)
  }

  getPhoneNumber = (): PageElement => cy.get('#phoneNumberInput')

  enterEmail = (email: string): void => {
    cy.get('#emAddr').clear()
    cy.get('#emAddr').type(email)
  }

  getEmail = (): PageElement => cy.get('#emAddr')

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
