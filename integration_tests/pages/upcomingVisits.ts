import Page, { PageElement } from './page'

export default class UpcomingVisitsPage extends Page {
  constructor() {
    super('Smith, John')
  }

  resultRow = (): PageElement => cy.get('.govuk-table__row')

  prisonerLink = (): PageElement => cy.get('.govuk-table__row > :nth-child(1) > a')

  visitReference = (): PageElement => cy.get('[data-test="visit-reference-1"]')

  visitReferenceLink = (): PageElement => cy.get('[data-test="visit-reference-1"] > a')

  mainContact = (): PageElement => cy.get('[data-test="visit-mainContact-1"]')

  visitDate = (): PageElement => cy.get('[data-test="visit-date-1"]')

  visitStatus = (): PageElement => cy.get('[data-test="visit-status-1"]')
}
