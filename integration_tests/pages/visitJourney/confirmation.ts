import Page, { PageElement } from '../page'

export default class ConfirmationPage extends Page {
  constructor({ title }: { title: string }) {
    super(title)

    cy.get('[data-test=go-to-home]').contains('Go to manage prison visits').should('have.attr', 'href', '/')
  }

  bookingReference = (): PageElement => cy.get('.test-booking-reference')

  prisonerName = (): PageElement => cy.get('.test-visit-prisoner-name')

  prisonerNumber = (): PageElement => cy.get('.test-visit-prisoner-number')

  visitDate = (): PageElement => cy.get('.test-visit-date')

  visitTime = (): PageElement => cy.get('.test-visit-time')

  visitType = (): PageElement => cy.get('.test-visit-type')

  visitorName = (number: number): PageElement => cy.get(`.test-visitor-name${number}`)

  additionalSupport = (): PageElement => cy.get('.test-additional-support')

  mainContactName = (): PageElement => cy.get('.test-main-contact-name')

  mainContactNumber = (): PageElement => cy.get('.test-main-contact-number')

  viewPrisonersProfileButton = (offenderNo): void => {
    cy.get('[data-test=go-to-prisoner]')
      .contains('View this prisoner’s profile')
      .should('have.attr', 'href', `/prisoner/${offenderNo}`)
  }
}
