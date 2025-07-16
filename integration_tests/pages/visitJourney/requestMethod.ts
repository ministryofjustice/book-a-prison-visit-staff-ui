import Page, { PageElement } from '../page'

export default class RequestMethodPage extends Page {
  constructor() {
    super('How was this booking requested?')
  }

  getRequestMethodByValue = (value: string): PageElement => cy.get(`input[value="${value}"]`)

  getRequestLabelByValue = (value: string): PageElement => cy.get(`input[value="${value}"] + label`)

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
