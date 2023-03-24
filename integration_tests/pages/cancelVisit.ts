import Page, { PageElement } from './page'

export default class CancelVisitPage extends Page {
  constructor() {
    super('Why is this booking being cancelled?')
  }

  // Radios
  visitorCancelledRadio = (): PageElement => cy.get('[data-test="visitor_cancelled"]')

  establishmentCancelledRadio = (): PageElement => cy.get('[data-test="establishment_cancelled"]')

  prisonerCancelledRadio = (): PageElement => cy.get('[data-test="prisoner_cancelled"]')

  administrativeErrorRadio = (): PageElement => cy.get('[data-test="administrative_error"]')

  // Hidden text inputs
  visitorCancelledText = (reason: string): void => {
    cy.get('#reason_visitor_cancelled').type(reason)
  }

  establishmentCancelledText = (reason: string): void => {
    cy.get('#reason_establishment_cancelled').type(reason)
  }

  prisonerCancelledText = (reason: string): void => {
    cy.get('#reason_prisoner_cancelled').type(reason)
  }

  administrativeErrorText = (reason: string): void => {
    cy.get('#reason_administrative_error').type(reason)
  }

  // Cancel visit button
  submit = (): PageElement => cy.get('[data-test="cancel-booking"]')
}
