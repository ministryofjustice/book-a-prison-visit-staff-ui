import Page, { PageElement } from './page'

export default class RequestMethodPage extends Page {
  constructor() {
    super('What method was used to make this request?')
  }

  getRequestMethodByValue = (value: string): PageElement => cy.get(`input[value="${value}"]`)

  getRequestLabelByValue = (value: string): PageElement => cy.get(`input[value="${value}"] + label`)

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
