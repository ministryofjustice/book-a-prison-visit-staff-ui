import Page, { PageElement } from './page'

export default class BlockedVisitPage extends Page {
  constructor() {
    super('Block visit dates')
  }

  blockedDate = (index: number): PageElement => cy.get(`[data-test="blocked-date-${index}`)

  blockedBy = (index: number): PageElement => cy.get(`[data-test="blocked-by-${index}`)

  unblockLink = (index: number): PageElement => cy.get(`[data-test="unblock-date-${index}"] a`)
}
