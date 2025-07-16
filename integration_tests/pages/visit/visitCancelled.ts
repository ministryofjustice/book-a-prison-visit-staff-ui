import Page, { PageElement } from '../page'

export default class VisitCancelledPage extends Page {
  constructor() {
    super('Booking cancelled')
  }

  visitDetails = (): PageElement => cy.get('[data-test="visit-details"]')

  homeButton = (): PageElement => cy.get('[data-test="back-to-start"]')
}
