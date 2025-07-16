import Page, { PageElement } from '../page'

export default class SelectVisitorsPage extends Page {
  constructor() {
    super('Select visitors')
  }

  getPrisonerRestrictionType = (index: number): PageElement => cy.get(`[data-test=restrictions-type${index}]`)

  getPrisonerRestrictionComment = (index: number): PageElement => cy.get(`[data-test=restrictions-comment${index}]`)

  getPrisonerRestrictionEndDate = (index: number): PageElement => cy.get(`[data-test=restrictions-end-date${index}]`)

  getPrisonerAlertType = (index: number): PageElement => cy.get(`[data-test=alert-type${index}]`)

  getPrisonerAlertComment = (index: number): PageElement => cy.get(`[data-test=alert-comment${index}]`)

  getPrisonerAlertEndDate = (index: number): PageElement => cy.get(`[data-test=alert-end-date${index}]`)

  showFullCommentLink = (): PageElement => cy.get('[data-test=show-full-comment]')

  closeFullCommentLink = (): PageElement => cy.get('[data-test=close-full-comment]')

  getVisitor = (visitorId: number): PageElement => cy.get(`#visitor-${visitorId}`)

  getVisitorRestrictions = (visitorId: number): PageElement => cy.get(`[data-test="visitor-restrictions-${visitorId}"]`)

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
