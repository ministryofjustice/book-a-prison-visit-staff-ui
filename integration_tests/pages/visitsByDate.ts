import Page, { PageElement } from './page'

export default class VisitsByDatePage extends Page {
  constructor() {
    super('View visits by date', {
      // Known issue with MoJ Side navigation component when using section headers. See:
      // https://design-patterns.service.justice.gov.uk/components/side-navigation/
      axeRulesToIgnore: ['heading-order'],
    })
  }

  dateTabsToday = (): PageElement => cy.get(':nth-child(1) > .moj-sub-navigation__link')

  dateTabsTomorrow = (): PageElement => cy.get(':nth-child(2) > .moj-sub-navigation__link')

  activeSessionNavLink = (): PageElement => cy.get('.moj-side-navigation__item--active > a')

  selectSessionNavItem = (index: number): void => {
    cy.get('.moj-side-navigation__item a').eq(index).click()
  }

  visitSessionHeading = (): PageElement => cy.get('[data-test="visit-session-heading"]')

  tablesBookedCount = (): PageElement => cy.get('[data-test="visit-tables-booked"]')

  visitorsTotalCount = (): PageElement => cy.get('[data-test="visit-visitors-total"]')

  prisonerName = (index: number): PageElement => cy.get(`:nth-child(${index}) > [data-test="prisoner-name"]`)

  prisonerNumber = (index: number): PageElement => cy.get(`:nth-child(${index}) > [data-test="prisoner-number"]`)

  noResultsMessage = (): PageElement => cy.get('[data-test="no-visits-message"]')

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
