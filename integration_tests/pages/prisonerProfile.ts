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

  selectUpcomingVisitsTab = (): PageElement => cy.get('#tab_upcoming-visits').click()

  selectVisitsHistoryTab = (): PageElement => cy.get('#tab_visits-history').click()

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

  upcomingTabReference = (): PageElement => cy.get('[data-test="tab-upcoming-reference"]')

  upcomingTabType = (): PageElement => cy.get('[data-test="tab-upcoming-type"]')

  upcomingTabLocation = (): PageElement => cy.get('[data-test="tab-upcoming-location"]')

  upcomingTabDateAndTime = (): PageElement => cy.get('[data-test="tab-upcoming-date-and-time"]')

  upcomingTabVisitors = (): PageElement => cy.get('[data-test="tab-upcoming-visitors"]')

  upcomingTabVisitStatus = (): PageElement => cy.get('[data-test="tab-upcoming-status"]')

  pastTabReference = (): PageElement => cy.get('[data-test="tab-past-reference"]')

  pastTabType = (): PageElement => cy.get('[data-test="tab-past-type"]')

  pastTabLocation = (): PageElement => cy.get('[data-test="tab-past-location"]')

  pastTabDateAndTime = (): PageElement => cy.get('[data-test="tab-past-date-and-time"]')

  pastTabVisitors = (): PageElement => cy.get('[data-test="tab-past-visitors"]')

  pastTabVisitStatus = (): PageElement => cy.get('[data-test="tab-past-status"]')
}
