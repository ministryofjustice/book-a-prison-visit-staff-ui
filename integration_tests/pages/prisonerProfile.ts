import Page, { PageElement } from './page'

export default class PrisonerProfilePage extends Page {
  constructor(variableTitle: string) {
    super(variableTitle)
  }

  flaggedAlerts = (): PageElement => cy.get('.flagged-alert')

  prisonNumber = (): PageElement => cy.get('[data-test="prison-number"]')

  dateOfBirth = (): PageElement => cy.get('[data-test="dob"]')

  location = (): PageElement => cy.get('[data-test="location"]')

  category = (): PageElement => cy.get('[data-test="category"]')

  incentiveLevel = (): PageElement => cy.get('[data-test="iep-level"]')

  convictionStatus = (): PageElement => cy.get('[data-test="convicted-status"]')

  alertCount = (): PageElement => cy.get('[data-test="active-alert-count"]')

  remainingVOs = (): PageElement => cy.get('[data-test="remaining-vos"]')

  remainingPVOs = (): PageElement => cy.get('[data-test="remaining-pvos"]')

  bookAVisitButton = (): PageElement => cy.get('[data-test="book-a-visit"]')

  selectVisitingOrdersTab = (): PageElement => cy.get('#tab_visiting-orders').click()

  selectActiveAlertsTab = (): PageElement => cy.get('#tab_active-alerts').click()

  selectVisitsTab = (): PageElement => cy.get('#tab_visits').click()

  visitTabVORemaining = (): PageElement => cy.get('[data-test="tab-vo-remaining"]')

  visitTabVOLastAdjustment = (): PageElement => cy.get('[data-test="tab-vo-last-date"]')

  visitTabVONextAdjustment = (): PageElement => cy.get('[data-test="tab-vo-next-date"]')

  visitTabPVORemaining = (): PageElement => cy.get('[data-test="tab-pvo-remaining"]')

  visitTabPVOLastAdjustment = (): PageElement => cy.get('[data-test="tab-pvo-last-date"]')

  visitTabPVONextAdjustment = (): PageElement => cy.get('[data-test="tab-pvo-next-date"]')

  alertsTabType = (): PageElement => cy.get('[data-test="tab-alerts-type-desc"]')

  alertsTabCode = (): PageElement => cy.get('[data-test="tab-alerts-code-desc"]')

  alertsTabComment = (): PageElement => cy.get('[data-test="tab-alerts-comment"]')

  alertsTabCreated = (): PageElement => cy.get('[data-test="tab-alerts-created"]')

  alertsTabExpires = (): PageElement => cy.get('[data-test="tab-alerts-expires"]')

  visitTabReference = (): PageElement => cy.get('[data-test="tab-visits-reference"]')

  visitTabType = (): PageElement => cy.get('[data-test="tab-visits-type"]')

  visitTabLocation = (): PageElement => cy.get('[data-test="tab-visits-location"]')

  visitTabDateAndTime = (): PageElement => cy.get('[data-test="tab-visits-date-and-time"]')

  visitTabVisitors = (): PageElement => cy.get('[data-test="tab-visits-visitors"]')

  visitTabVisitStatus = (): PageElement => cy.get('[data-test="tab-visits-status"]')

  visitTabCaption = (): PageElement => cy.get('.govuk-table__caption--m')
}
