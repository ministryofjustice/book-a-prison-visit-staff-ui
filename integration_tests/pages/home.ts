import Page, { PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Manage prison visits')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  bookAVisitTile = (): PageElement => cy.get('[data-test="book-visit"]')

  changeAVisitTile = (): PageElement => cy.get('[data-test="change-visit"]')

  viewVisitsTile = (): PageElement => cy.get('[data-test="view-visits-by-date"]')

  viewTimetableTile = (): PageElement => cy.get('[data-test="view-timetable"]')
}
