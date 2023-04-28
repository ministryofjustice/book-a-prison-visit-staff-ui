import Page, { PageElement } from './page'

export default class SelectVisitorsPage extends Page {
  constructor() {
    super('Select visitors from the prisoner’s approved visitor list')
  }

  getPrisonerRestrictionType = (index: number): PageElement =>
    cy.get(`.prisoner-restrictions .test-restrictions-type${index}`)

  getPrisonerRestrictionComment = (index: number): PageElement =>
    cy.get(`.prisoner-restrictions .test-restrictions-comment${index}`)

  getPrisonerRestrictionStartDate = (index: number): PageElement =>
    cy.get(`.prisoner-restrictions .test-restrictions-start-date${index}`)

  getPrisonerRestrictionEndDate = (index: number): PageElement =>
    cy.get(`.prisoner-restrictions .test-restrictions-end-date${index}`)

  getVisitor = (visitorId: number): PageElement => cy.get(`#visitor-${visitorId}`)

  getVisitorRestrictions = (visitorId: number): PageElement => cy.get(`[data-test="visitor-restrictions-${visitorId}"]`)

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
