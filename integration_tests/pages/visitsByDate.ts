import Page, { PageElement } from './page'

export default class VisitsByDatePage extends Page {
  constructor() {
    super('View visits by date')
  }

  today = (): PageElement => cy.get(':nth-child(1) > .moj-sub-navigation__link')

  tomorrow = (): PageElement => cy.get(':nth-child(2) > .moj-sub-navigation__link')

  tablesBookedCount = (): PageElement => cy.get('[data-test="visit-tables-booked"]')

  visitorsTotalCount = (): PageElement => cy.get('[data-test="visit-visitors-total"]')

  adultVisitorsCount = (): PageElement => cy.get('[data-test="visit-adults"]')

  childVisitorsCount = (): PageElement => cy.get('[data-test="visit-children"]')

  prisonerOneName = (): PageElement => cy.get(':nth-child(1) > [data-test="prisoner-name"]')

  prisonerOneNumber = (): PageElement => cy.get(':nth-child(1) > [data-test="prisoner-number"]')

  prisonerTwoName = (): PageElement => cy.get(':nth-child(2) > [data-test="prisoner-name"]')

  prisonerTwoNumber = (): PageElement => cy.get(':nth-child(2) > [data-test="prisoner-number"]')
}
