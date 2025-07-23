import Page, { PageElement } from '../page'

export default class VisitDetailsPage extends Page {
  constructor({ visitType }: { visitType: 'booking' | 'request' }) {
    super(visitType === 'booking' ? 'Visit booking details' : 'Visit request details')
  }

  // Visit Details
  visitDate = (): PageElement => cy.get('[data-test="visit-date"]')

  visitTime = (): PageElement => cy.get('[data-test="visit-time"]')

  visitRoom = (): PageElement => cy.get('[data-test="visit-room"]')

  visitType = (): PageElement => cy.get('[data-test="visit-type"]')

  visitContact = (): PageElement => cy.get('[data-test="visit-contact"]')

  visitPhone = (): PageElement => cy.get('[data-test="visit-phone"]')

  visitEmail = (): PageElement => cy.get('[data-test="visit-email"]')

  visitReference = (): PageElement => cy.get('[data-test=reference]')

  additionalSupport = (): PageElement => cy.get('[data-test=additional-support]')

  // Prisoner Details
  prisonerName = (): PageElement => cy.get('[data-test="prisoner-name"]')

  prisonerNumber = (): PageElement => cy.get('[data-test="prisoner-number"]')

  prisonerLocation = (): PageElement => cy.get('[data-test="prisoner-location"]')

  prisonerDob = (): PageElement => cy.get('[data-test="prisoner-dob"]')

  prisonerAge = (): PageElement => cy.get('[data-test="prisoner-age"]')

  prisonerRestriction = (index: number): PageElement => cy.get(`[data-test="prisoner-restriction-${index}"]`)

  prisonerAlert = (index: number): PageElement => cy.get(`[data-test="prisoner-alert-${index}"]`)

  // Buttons
  updateBooking = (): PageElement => cy.get('[data-test="update-visit"]')

  cancelBooking = (): PageElement => cy.get('[data-test="cancel-visit"]')

  clearNotifications = (): PageElement => cy.get('[data-test="clear-notifications')

  // Visitor Details-1
  visitorName = (index: number): PageElement => cy.get(`[data-test="visitor-name-${index}"]`)

  visitorRelation = (index: number): PageElement => cy.get(`[data-test="visitor-relation-${index}"]`)

  visitorRestriction = (visitorIndex: number, index: number): PageElement =>
    cy.get(`[data-test="visitor-${visitorIndex}-restriction-${index}"]`)

  // Visit history
  eventHeader = (index: number): PageElement => cy.get(`[data-test="timeline-entry-${index}"] .moj-timeline__title`)

  actionedBy = (index: number): PageElement => cy.get(`[data-test="timeline-entry-${index}"] .moj-timeline__byline`)

  eventTime = (index: number): PageElement => cy.get(`[data-test="timeline-entry-${index}"] time`)

  eventDescription = (index: number): PageElement =>
    cy.get(`[data-test="timeline-entry-${index}"] .moj-timeline__description`)
}
