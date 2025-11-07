import Page, { PageElement } from '../page'

export default class BookerDetailsPage extends Page {
  constructor() {
    super('Booker details')
  }

  getBookerEmail = (): PageElement => cy.get('[data-test=booker-email]')

  getBookerReference = (): PageElement => cy.get('[data-test=booker-reference]')

  getPrisonerHeading = (index: number): PageElement => cy.get(`[data-test=prisoner-${index}]`)

  getPrisonerVisitorName = (prisonerIndex: number, visitorIndex: number): PageElement =>
    cy.get(`[data-test=prisoner-${prisonerIndex}-visitor-${visitorIndex}-name]`)

  unlinkPrisonerVisitor = (prisonerIndex: number, visitorIndex: number): void => {
    cy.get(`[data-test=prisoner-${prisonerIndex}-visitor-${visitorIndex}-unlink]`).click()
  }
}
