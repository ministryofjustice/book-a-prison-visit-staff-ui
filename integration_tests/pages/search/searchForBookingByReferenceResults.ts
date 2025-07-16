import Page, { PageElement } from '../page'

export default class SearchForBookingByReferenceResultsPage extends Page {
  constructor() {
    super('Search for a booking')
  }

  visitReference = (): PageElement => cy.get('[data-test=visit-reference]')

  visitReferenceLink = (): PageElement => cy.get('[data-test=visit-reference] > a')

  prisonerName = (): PageElement => cy.get('[data-test=prisoner-name]')

  prisonerNumber = (): PageElement => cy.get('[data-test=prisoner-number]')

  visitStatus = (): PageElement => cy.get('[data-test=visit-status]')
}
