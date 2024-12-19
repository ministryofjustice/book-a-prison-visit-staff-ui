import Page, { PageElement } from './page'

export default class SelectVisitorsPage extends Page {
  constructor() {
    super('Select visitors from the prisoner’s approved visitor list')
  }

  getPrisonerRestrictionType = (index: number): PageElement => cy.get(`.test-restrictions-type${index}`)

  getPrisonerRestrictionComment = (index: number): PageElement => cy.get(`.test-restrictions-comment${index}`)

  getPrisonerRestrictionEndDate = (index: number): PageElement => cy.get(`.test-restrictions-end-date${index}`)

  getPrisonerAlertType = (index: number): PageElement => cy.get(`.test-alert-type${index}`)

  getPrisonerAlertComment = (index: number): PageElement => cy.get(`.test-alert-comment${index}`)

  getPrisonerAlertEndDate = (index: number): PageElement => cy.get(`.test-alert-end-date${index}`)

  getVisitor = (visitorId: number): PageElement => cy.get(`#visitor-${visitorId}`)

  getVisitorRestrictions = (visitorId: number): PageElement => cy.get(`[data-test="visitor-restrictions-${visitorId}"]`)

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
