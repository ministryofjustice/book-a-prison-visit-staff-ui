import Page, { PageElement } from './page'

export default class MainContactPage extends Page {
  constructor() {
    super('Who is the main contact for this booking?', {
      // Known issue with radio conditional reveal. See:
      // https://github.com/alphagov/govuk-frontend/issues/979
      axeRulesToIgnore: ['aria-allowed-attr'],
    })
  }

  getFirstContact = (): PageElement => cy.get('#contact')

  enterPhoneNumber = (number: string): void => {
    cy.get('#phoneNumber').clear()
    cy.get('#phoneNumber').type(number)
  }

  getPhoneNumber = (): PageElement => cy.get('#phoneNumber')

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
