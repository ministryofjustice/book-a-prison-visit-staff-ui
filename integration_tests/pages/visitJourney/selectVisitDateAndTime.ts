import Page, { PageElement } from '../page'

export default class SelectVisitDateAndTime extends Page {
  constructor() {
    super('Select date and time of visit')
  }

  expandAllSections = (): void => {
    cy.get('.govuk-accordion__show-all').each(section => cy.wrap(section).click())
  }

  getSlotById = (id: number): PageElement => cy.get(`#${id}`)

  continueButton = (): PageElement => cy.get('[data-test=submit]')

  visitRestriction = (): PageElement => cy.get('[data-test="visit-restriction"]')
}
