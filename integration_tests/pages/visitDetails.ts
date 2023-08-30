import Page, { PageElement } from './page'

export default class VisitDetailsPage extends Page {
  constructor() {
    super('Visit booking details')
  }

  visitReference = (): PageElement => cy.get('[data-test=reference]')

  cancellationReason = (): PageElement => cy.get('[data-test="cancelled-visit-reason')

  // Buttons
  updateBooking = (): PageElement => cy.get('[data-test="update-visit"]')

  cancelBooking = (): PageElement => cy.get('[data-test="cancel-visit"]')

  // Subnavigation

  selectPrisonerTab = (): PageElement => cy.get('[data-test="select-prisoner-tab"]').click()

  selectVisitorTab = (): PageElement => cy.get('[data-test="select-visitor-tab"]').click()

  selectHistoryTab = (): PageElement => cy.get('[data-test="select-history-tab"]').click()

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

  // Visitor Details-1
  visitorName1 = (): PageElement => cy.get('[data-test="test-visitor-name1"]')

  visitorDob1 = (): PageElement => cy.get('[data-test="test-visitor-dob1"]')

  visitorRelationship1 = (): PageElement => cy.get('[data-test="test-visitor-relationship1"]')

  visitorAddress1 = (): PageElement => cy.get('[data-test="test-visitor-address1"]')

  visitorRestrictions1 = (): PageElement => cy.get('[data-test="test-visitor-restrictions1"]')

  // Visitor Details-2
  visitorName2 = (): PageElement => cy.get('[data-test="test-visitor-name2"]')

  visitorDob2 = (): PageElement => cy.get('[data-test="test-visitor-dob2"]')

  visitorRelationship2 = (): PageElement => cy.get('[data-test="test-visitor-relationship2"]')

  visitorAddress2 = (): PageElement => cy.get('[data-test="test-visitor-address2"]')

  visitorRestrictions2 = (): PageElement => cy.get('[data-test="test-visitor-restriction2"]')

  // Additional Information
  additionalSupport = (): PageElement => cy.get('[data-test=additional-support]')

  // Visit history
  eventHeader = (index: number): PageElement => cy.get(`[data-test="visit-event-${index}"]`)

  actionedBy = (index: number): PageElement => cy.get(`[data-test="visit-actioned-by-${index}"]`)

  eventTime = (index: number): PageElement => cy.get(`[data-test="visit-event-date-time-${index}"]`)

  requestMethod = (index: number): PageElement => cy.get(`[data-test="visit-request-method-${index}"]`)
}
