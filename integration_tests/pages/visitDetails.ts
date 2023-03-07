import Page, { PageElement } from './page'

export default class VisitDetailsPage extends Page {
  constructor() {
    super('Booking details')
  }

  visitReference = (): PageElement => cy.get('[data-test=reference]')

  // Buttons
  updateBooking = (): PageElement => cy.get('[data-test="update-visit"]')

  cancelBooking = (): PageElement => cy.get('[data-test="cancel-visit"]')

  // Prisoner Details
  prisonerName = (): PageElement => cy.get('[data-test=prisoner-name]')

  prisonerNumber = (): PageElement => cy.get('[data-test=prisoner-number]')

  prisonerDob = (): PageElement => cy.get('[data-test=prisoner-dob]')

  prisonerLocation = (): PageElement => cy.get('[data-test=prisoner-location]')

  // Visit Details
  visitDate = (): PageElement => cy.get('[data-test=visit-date]')

  visitTime = (): PageElement => cy.get('[data-test=visit-time]')

  visitType = (): PageElement => cy.get('[data-test=visit-type]')

  visitContact = (): PageElement => cy.get('[data-test=visit-contact]')

  visitPhone = (): PageElement => cy.get('[data-test=visit-phone]')

  // Visitor Details-1
  visitorName1 = (): PageElement => cy.get('[data-test=visitor-name-1]')

  visitorDob1 = (): PageElement => cy.get('[data-test=visitor-dob-1]')

  visitorRelationship1 = (): PageElement => cy.get('[data-test=visitor-relationship-1]')

  visitorAddress1 = (): PageElement => cy.get('[data-test=visitor-address-1]')

  visitorRestrictions1 = (): PageElement => cy.get('[data-test=visitor-restrictions-1]')

  // Visitor Details-2
  visitorName2 = (): PageElement => cy.get('[data-test=visitor-name-2]')

  visitorDob2 = (): PageElement => cy.get('[data-test=visitor-dob-2]')

  visitorRelationship2 = (): PageElement => cy.get('[data-test=visitor-relationship-2]')

  visitorAddress2 = (): PageElement => cy.get('[data-test=visitor-address-2]')

  visitorRestrictions2 = (): PageElement => cy.get('[data-test=visitor-restrictions-2]')

  // Additional Information
  visitComment = (): PageElement => cy.get('[data-test=visit-comment]')

  visitorConcern = (): PageElement => cy.get('[data-test=visitor-concern]')

  additionalSupport = (): PageElement => cy.get('[data-test=additional-support]')

  visitBooked = (): PageElement => cy.get('[data-test="visit-booked"]')
}
