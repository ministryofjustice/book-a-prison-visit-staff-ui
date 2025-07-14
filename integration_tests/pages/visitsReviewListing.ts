import Page, { PageElement } from './page'

export default class VisitsReviewListingPage extends Page {
  constructor() {
    super('Visits that need review')
  }

  filterByUser = (username: string): void => {
    cy.get('#button-bookedBy').click()
    cy.get(`[data-test="${username}"]`).check()
  }

  filterByReason = (type: string): void => {
    cy.get('#button-type').click()
    cy.get(`[data-test="${type}"]`).check()
  }

  applyFilter = (): void => {
    cy.get('[data-test="bapv-filter-apply"]').click()
  }

  clearFilters = (): void => {
    cy.get('#reset-filters').click()
  }

  removeFilter = (label: string): void => {
    cy.get('.moj-filter__tag').contains(label).click()
  }

  getBookingsRows = (): PageElement => cy.get('[data-test="bookings-list"] tbody tr')

  getPrisonerNumber = (row: number): PageElement => cy.get(`[data-test="prisoner-number-${row}"]`)

  getVisitDate = (row: number): PageElement => cy.get(`[data-test="visit-date-${row}"]`)

  getBookedBy = (row: number): PageElement => cy.get(`[data-test="booked-by-${row}"]`)

  getTypes = (row: number): PageElement => cy.get(`[data-test="type-${row}"]`)

  getActionLink = (row: number): PageElement => cy.get(`[data-test="action-${row}"] a`)
}
