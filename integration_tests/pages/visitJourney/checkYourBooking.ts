import Page, { PageElement } from '../page'

export default class CheckYourBookingPage extends Page {
  constructor() {
    super('Check the visit details before booking')
  }

  prisonerName = (): PageElement => cy.get('.test-prisoner-name')

  visitDate = (): PageElement => cy.get('.test-visit-date')

  changeVisitDate = (): PageElement => cy.get('[data-test="change-date"]')

  visitTime = (): PageElement => cy.get('.test-visit-time')

  visitType = (): PageElement => cy.get('.test-visit-type')

  visitorName = (number: number): PageElement => cy.get(`.test-visitor-name${number}`)

  changeVisitors = (): PageElement => cy.get('[data-test="change-visitors"]')

  additionalSupport = (): PageElement => cy.get('.test-additional-support')

  changeAdditionalSupport = (): PageElement => cy.get('[data-test="change-additional-support"]')

  mainContactName = (): PageElement => cy.get('.test-main-contact-name')

  mainContactNumber = (): PageElement => cy.get('.test-main-contact-number')

  mainContactEmail = (): PageElement => cy.get('.test-main-contact-email')

  changeMainContact = (): PageElement => cy.get('[data-test="change-main-contact"]')

  requestMethod = (): PageElement => cy.get('.test-request-method')

  changeRequestMethod = (): PageElement => cy.get('[data-test="change-request-method"]')

  submitBooking = (): void => this.clickDisabledOnSubmitButton('submit')
}
