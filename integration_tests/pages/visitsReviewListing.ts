import Page, { PageElement } from './page'

export default class VisitsReviewListingPage extends Page {
  constructor() {
    super('Visit bookings that need review')
  }

  getPrisonerNumber = (row: number): PageElement => cy.get(`[data-test="prisoner-number-${row}"]`)

  getVisitDate = (row: number): PageElement => cy.get(`[data-test="visit-date-${row}"]`)

  getBookedBy = (row: number): PageElement => cy.get(`[data-test="booked-by-${row}"]`)

  getType = (row: number): PageElement => cy.get(`[data-test="type-${row}"]`)

  getActionLink = (row: number): PageElement => cy.get(`[data-test="action-${row}"] a`)
}
