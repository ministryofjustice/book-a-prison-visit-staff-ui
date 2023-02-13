import Page, { PageElement } from './page'

export default class SelectVisitorsPage extends Page {
  constructor() {
    super('Select visitors from the prisoner’s approved visitor list')
  }

  getVisitor = (visitorId: number): PageElement => cy.get(`#visitor-${visitorId}`)

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
