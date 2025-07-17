import Page, { PageElement } from '../page'

export default class VisitRequestsListingPage extends Page {
  constructor() {
    super('Requested visits')
  }

  getVisitDate = (row: number): PageElement => cy.get(`[data-test="visit-date-${row}"]`)

  getVisitRequestedDate = (row: number): PageElement => cy.get(`[data-test="visit-requested-date-${row}"]`)

  getPrisonerName = (row: number): PageElement => cy.get(`[data-test="prisoner-name-${row}"]`)

  getPrisonNumber = (row: number): PageElement => cy.get(`[data-test="prison-number-${row}"]`)

  getMainContact = (row: number): PageElement => cy.get(`[data-test="main-contact-${row}"]`)

  getAction = (row: number): PageElement => cy.get(`[data-test="action-${row}"]`)
}
