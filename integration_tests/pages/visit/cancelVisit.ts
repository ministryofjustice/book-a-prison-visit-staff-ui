import Page, { PageElement } from '../page'

export default class CancelVisitPage extends Page {
  constructor() {
    super('Why is this booking being cancelled?', {
      // Known issue with radio conditional reveal. See:
      // https://github.com/alphagov/govuk-frontend/issues/979
      axeRulesToIgnore: ['aria-allowed-attr'],
    })
  }

  // Cancellation reason radios
  visitorCancelledRadio = (): PageElement => cy.get('[data-test="visitor_cancelled"]')

  establishmentCancelledRadio = (): PageElement => cy.get('[data-test="establishment_cancelled"]')

  prisonerCancelledRadio = (): PageElement => cy.get('[data-test="prisoner_cancelled"]')

  administrativeErrorRadio = (): PageElement => cy.get('[data-test="administrative_error"]')

  // Request method
  getRequestMethodByValue = (value: string): PageElement => cy.get(`input[value="${value}"]`)

  // Text input
  enterCancellationReasonText = (reason: string): void => {
    cy.get('#reason').type(reason)
  }

  // Cancel visit button
  submit = (): PageElement => cy.get('[data-test="cancel-booking"]')
}
