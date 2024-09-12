import Page, { PageElement } from './page'
import DatePickerComponent from '../components/datePicker'

export default class BlockVisitDatesPage extends Page {
  datePicker: DatePickerComponent

  constructor() {
    super('Block visit dates')
    this.datePicker = new DatePickerComponent()
  }

  getMessage = (): PageElement => cy.get('.moj-banner__message')

  continue = (): void => {
    cy.get('[data-test="submit"]').click()
  }

  noBlockedDates = (): PageElement => cy.get('[data-test="no-blocked-dates"]')

  blockedDate = (index: number): PageElement => cy.get(`[data-test="blocked-date-${index}`)

  blockedBy = (index: number): PageElement => cy.get(`[data-test="blocked-by-${index}`)

  unblockLink = (index: number): PageElement => cy.get(`[data-test="unblock-date-${index}"]`)
}
