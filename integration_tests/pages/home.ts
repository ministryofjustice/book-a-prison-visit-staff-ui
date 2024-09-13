import Page, { PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Manage prison visits')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  currentEstablishment = (): PageElement => cy.get('[data-test="active-location"]')

  changeEstablishmentLink = (): PageElement => cy.get('[data-test="change-establishment"]')

  bookOrChangeVisitTile = (): PageElement => cy.get('[data-test="book-or-change-visit"]')

  needReviewTile = (): PageElement => cy.get('[data-test="need-review"]')

  needReviewBadgeCount = (): PageElement => cy.get('[data-test="need-review-count"]')

  viewVisitsTile = (): PageElement => cy.get('[data-test="view-visits-by-date"]')

  viewTimetableTile = (): PageElement => cy.get('[data-test="view-timetable"]')

  blockDatesTile = (): PageElement => cy.get('[data-test="block-dates"]')
}
