import Page, { PageElement } from './page'

export default class VisitsByDatePage extends Page {
  constructor() {
    super('View visits by date')
  }

  today = (): PageElement => cy.get(':nth-child(1) > .moj-sub-navigation__link')

  tomorrow = (): PageElement => cy.get(':nth-child(2) > .moj-sub-navigation__link')

  tablesBookedCount = (): PageElement => cy.get('[data-test="visit-tables-booked"]')

  visitorsTotalCount = (): PageElement => cy.get('[data-test="visit-visitors-total"]')

  adultVisitorsCount = (): PageElement => cy.get('[data-test="visit-adults"]')

  childVisitorsCount = (): PageElement => cy.get('[data-test="visit-children"]')

  prisonerRowOneName = (): PageElement => cy.get(':nth-child(1) > [data-test="prisoner-name"]')

  prisonerRowOneNumber = (): PageElement => cy.get(':nth-child(1) > [data-test="prisoner-number"]')

  prisonerRowTwoName = (): PageElement => cy.get(':nth-child(2) > [data-test="prisoner-name"]')

  prisonerRowTwoNumber = (): PageElement => cy.get(':nth-child(2) > [data-test="prisoner-number"]')

  visitType = (): PageElement => cy.get('[data-test="visit-room"]')

  noResultsMessage = (): PageElement => cy.get('#search-results-none')

  // another date form
  toggleChooseAnotherDatePopUp = (): void => {
    cy.get('[data-test="another-date-button"]').click()
  }

  // Date picker
  datePickerEnterDate = (date: string): void => {
    cy.get('.js-datepicker-cancel').click({ force: true })
    cy.get('.hmpps-js-datepicker-input').clear()
    cy.get('.hmpps-js-datepicker-input').type(`${date}{enter}`)
    this.datePickerToggleCalendar()
  }

  datePickerGetEnteredDate = (): PageElement => cy.get('.hmpps-js-datepicker-input')

  datePickerToggleCalendar = (): void => {
    cy.get('.hmpps-js-datepicker-button').click()
  }

  datePickerGoToPreviousYear = (): void => {
    cy.get('[data-button="button-datepicker-prevyear"]').click()
  }

  datePickerGoToPreviousMonth = (): void => {
    cy.get('[data-button="button-datepicker-prevmonth"]').click()
  }

  datePickerGoToNextMonth = (): void => {
    cy.get('[data-button="button-datepicker-nextmonth"]').click()
  }

  datePickerGoToNextYear = (): void => {
    cy.get('[data-button="button-datepicker-nextyear"]').click()
  }

  datePickerSelectDay = (day: number) => {
    cy.get('button[data-form="date-select"]:visible')
      .contains(new RegExp(`^${day}$`))
      .click()
  }

  datePickerClickViewDate = (): void => {
    cy.get('[data-test="submit"]').click()
  }
}
