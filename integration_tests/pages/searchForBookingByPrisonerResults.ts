import Page, { PageElement } from './page'

export default class SearchForBookingByPrisonerResultsPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  resultRow = (): PageElement => cy.get('.govuk-table__row')

  prisonerLink = (): PageElement => cy.get('.govuk-table__row > :nth-child(1) > a')
}
