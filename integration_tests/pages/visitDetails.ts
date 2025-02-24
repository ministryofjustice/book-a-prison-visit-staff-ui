import Page, { PageElement } from './page'

export default class VisitDetailsPage extends Page {
  constructor() {
    super('Visit booking details')
  }

  visitReference = (): PageElement => cy.get('[data-test=reference]')

  cancellationType = (): PageElement => cy.get('[data-test="visit-cancelled-type')

  visitNotification = (): PageElement => cy.get('[data-test="visit-notification')

  // Buttons
  updateBooking = (): PageElement => cy.get('[data-test="update-visit"]')

  cancelBooking = (): PageElement => cy.get('[data-test="cancel-visit"]')

  clearNotifications = (): PageElement => cy.get('[data-test="clear-notifications')

  // Sub-navigation

  selectPrisonerTab = (): PageElement => cy.get('#tab_prisoner-details').click()

  selectVisitorTab = (): PageElement => cy.get('#tab_visitors').click()

  selectHistoryTab = (): PageElement => cy.get('#tab_history').click()

  // Prisoner Details
  prisonerName = (): PageElement => cy.get('[data-test="prisoner-name"]')

  prisonerNumber = (): PageElement => cy.get('[data-test="prisoner-number"]')

  prisonerDob = (): PageElement => cy.get('[data-test="prisoner-dob"]')

  prisonerLocation = (): PageElement => cy.get('[data-test="prisoner-location"]')

  // Visit Details
  visitDateAndTime = (): PageElement => cy.get('[data-test="visit-date-and-time"]')

  visitType = (): PageElement => cy.get('[data-test="visit-type"]')

  visitContact = (): PageElement => cy.get('[data-test="visit-contact"]')

  visitPhone = (): PageElement => cy.get('[data-test="visit-phone"]')

  visitEmail = (): PageElement => cy.get('[data-test="visit-email"]')

  // Visitor Details-1
  visitorName1 = (): PageElement => cy.get('[data-test="visitor-name1"]')

  visitorDob1 = (): PageElement => cy.get('[data-test="visitor-dob1"]')

  visitorRelationship1 = (): PageElement => cy.get('[data-test="visitor-relationship1"]')

  visitorAddress1 = (): PageElement => cy.get('[data-test="visitor-address1"]')

  visitorRestrictions1 = (): PageElement => cy.get('[data-test="visitor-restrictions1"]')

  // Visitor Details-2
  visitorName2 = (): PageElement => cy.get('[data-test="visitor-name2"]')

  visitorDob2 = (): PageElement => cy.get('[data-test="visitor-dob2"]')

  visitorRelationship2 = (): PageElement => cy.get('[data-test="visitor-relationship2"]')

  visitorAddress2 = (): PageElement => cy.get('[data-test="visitor-address2"]')

  visitorRestrictions2 = (): PageElement => cy.get('[data-test="visitor-restriction2"]')

  // Additional Information
  additionalSupport = (): PageElement => cy.get('[data-test=additional-support]')

  // Visit history
  eventHeader = (index: number): PageElement => cy.get(`[data-test="timeline-entry-${index}"] .moj-timeline__title`)

  actionedBy = (index: number): PageElement => cy.get(`[data-test="timeline-entry-${index}"] .moj-timeline__byline`)

  eventTime = (index: number): PageElement => cy.get(`[data-test="timeline-entry-${index}"] time`)

  eventDescription = (index: number): PageElement =>
    cy.get(`[data-test="timeline-entry-${index}"] .moj-timeline__description`)
}
