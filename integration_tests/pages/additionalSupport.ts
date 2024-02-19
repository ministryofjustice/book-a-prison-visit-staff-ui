import Page, { PageElement } from './page'

export default class AdditionalSupportPage extends Page {
  constructor() {
    super('Is additional support needed for any of the visitors?', {
      // Known issue with radio conditional reveal. See:
      // https://github.com/alphagov/govuk-frontend/issues/979
      axeRulesToIgnore: ['aria-allowed-attr'],
    })
  }

  additionalSupportRequired = (): PageElement => cy.get('[data-test=support-required-yes]')

  additionalSupportNotRequired = (): PageElement => cy.get('[data-test=support-required-no]')

  enterOtherSupportDetails = (details: string): void => {
    cy.get('#otherSupportDetails').type(details)
  }

  selectSupportType = (type: string): void => {
    cy.get(`[data-test=${type}]`).check({ force: true })
  }

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
