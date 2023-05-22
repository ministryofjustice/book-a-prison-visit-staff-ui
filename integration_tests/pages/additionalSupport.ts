import Page, { PageElement } from './page'

export default class AdditionalSupportPage extends Page {
  constructor() {
    super('Is additional support needed for any of the visitors?')
  }

  additionalSupportRequired = (): PageElement => cy.get('[data-test=support-required-yes]')

  additionalSupportNotRequired = (): PageElement => cy.get('[data-test=support-required-no]')

  enterOtherSupportDetails = (details: string): void => {
    cy.get('#otherSupportDetails').type(details)
  }

  selectSupportType = (type: string): void => {
    cy.get(`[data-test=${type}]`).check()
  }

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
