import Page, { PageElement } from './page'

export default class CheckYourBookingPage extends Page {
  constructor() {
    super('Check the visit details before booking')
  }

  prisonerName = (): PageElement => cy.get('.test-prisoner-name')

  visitDate = (): PageElement => cy.get('.test-visit-date')

  visitTime = (): PageElement => cy.get('.test-visit-time')

  visitType = (): PageElement => cy.get('.test-visit-type')

  visitorName = (number: number): PageElement => cy.get(`.test-visitor-name${number}`)

  additionalSupport = (): PageElement => cy.get('.test-additional-support')

  mainContactName = (): PageElement => cy.get('.test-main-contact-name')

  mainContactNumber = (): PageElement => cy.get('.test-main-contact-number')

  bookButton = (): PageElement => cy.get('[data-test=submit]')
}
