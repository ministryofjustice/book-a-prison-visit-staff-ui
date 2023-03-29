import Page, { PageElement } from './page'

export default class VisitsByDatePage extends Page {
  constructor() {
    super('View visits by date')
  }

  visitDetails = (): PageElement => cy.get('[data-test="visit-details"]')
}
