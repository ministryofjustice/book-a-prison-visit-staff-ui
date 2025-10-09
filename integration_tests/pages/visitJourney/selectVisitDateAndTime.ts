import Page, { PageElement } from '../page'

export default class SelectVisitDateAndTime extends Page {
  constructor() {
    super('Select date and time of visit')
  }

  clickCalendarDay = (date: string): void => {
    cy.get(`#day-link-${date}`).click()
  }

  getSessionLabel = (date: string, index: number): PageElement =>
    cy.get(`#day-group-${date} input`).eq(index).siblings('label')

  selectSession = (date: string, index: number): void => {
    cy.get(`#day-group-${date} input`).eq(index).click()
  }

  clickContinueButton = (): void => this.clickDisabledOnSubmitButton('submit')

  visitRestriction = (): PageElement => cy.get('[data-test="visit-restriction"]')
}
