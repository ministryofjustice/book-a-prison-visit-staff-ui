import Page, { PageElement } from './page'

export default class AuthorisationErrorPage extends Page {
  constructor() {
    super('Authorisation Error')
  }

  message = (): PageElement => cy.get('#main-content > p')
}
