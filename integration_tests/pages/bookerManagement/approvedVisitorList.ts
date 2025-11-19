import Page, { PageElement } from '../page'

export default class ApprovedVisitorListPage extends Page {
  constructor() {
    super('Link a visitor')
  }

  getVisitorName = (index: number): PageElement => cy.get(`[data-test=visitor-${index}-name]`)

  getVisitorDob = (index: number): PageElement => cy.get(`[data-test=visitor-${index}-dob]`)

  getVisitorLastVisitDate = (index: number): PageElement => cy.get(`[data-test=visitor-${index}-last-visit]`)

  getVisitor = (visitorId: number): PageElement => cy.get(`#visitor-${visitorId}`)

  linkVisitor = (): PageElement => cy.get('[data-test=link-visitor]')
}
