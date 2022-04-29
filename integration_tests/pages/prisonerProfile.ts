import Page, { PageElement } from './page'

export default class PrisonerProfilePage extends Page {
  constructor(variableTitle: string) {
    super(variableTitle)
  }

  backLink = (): PageElement => cy.get('[class="govuk-back-link"]')

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
}
