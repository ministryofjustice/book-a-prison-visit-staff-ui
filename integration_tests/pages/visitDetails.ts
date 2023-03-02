import Page, { PageElement } from './page'

export default class VisitDetailsPage extends Page {
  constructor() {
    super('Booking details')
  }

  visitReference = (): PageElement => cy.get('[data-test=reference]')

  prisonerName = (): PageElement => cy.get('[data-test=prisoner-name]')

  visitContact = (): PageElement => cy.get('[data-test=visit-contact]')

  visitorName1 = (): PageElement => cy.get('[data-test=visitor-name-1]')

  visitorName2 = (): PageElement => cy.get('[data-test=visitor-name-2]')
}
