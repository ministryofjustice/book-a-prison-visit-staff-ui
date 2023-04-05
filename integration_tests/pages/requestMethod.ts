import Page, { PageElement } from './page'

export default class RequestMethodPage extends Page {
  constructor() {
    super('What method was used to make this request?')
  }

  checkbox1 = (): PageElement => cy.get('#method')

  textValue1 = (): PageElement => cy.get(':nth-child(1) > .govuk-label')

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
