import Page, { PageElement } from '../page'

export default class ConfirmUpdatePage extends Page {
  constructor() {
    super('This visit is in less than 2 days. Do you want to update the booking?')
  }

  // Cancellation reason radios
  confirmUpdateYesRadio = (): PageElement => cy.get('#confirmUpdate')

  // Cancel visit button
  submit = (): PageElement => cy.get('[data-test="submit"]')
}
