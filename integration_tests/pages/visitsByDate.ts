import DatePickerComponent from '../components/datePicker'
import Page, { PageElement } from './page'

export default class VisitsByDatePage extends Page {
  datePicker: DatePickerComponent

  constructor() {
    super('View visits by date', {
      // Known issue with MoJ Side navigation component when using section headers. See:
      // https://design-patterns.service.justice.gov.uk/components/side-navigation/
      axeRulesToIgnore: ['heading-order'],
    })

    this.datePicker = new DatePickerComponent()
  }

  dateTabsToday = (): PageElement => cy.get(':nth-child(1) > .moj-sub-navigation__link')

  dateTabsTomorrow = (): PageElement => cy.get(':nth-child(2) > .moj-sub-navigation__link')

  activeSessionNavLink = (): PageElement => cy.get('.moj-side-navigation__item--active > a')

  selectSessionNavItem = (index: number): void => {
    cy.get('.moj-side-navigation__item a').eq(index).click()
  }

  visitSessionHeading = (): PageElement => cy.get('[data-test=visit-session-heading]')

  visitSectionHeading = (type: string): PageElement => cy.get(`[data-test="visit-section-heading-${type}"]`)

  tablesBookedCount = (type: string): PageElement => cy.get(`[data-test="visit-tables-booked-${type}"]`)

  visitorsTotalCount = (type: string): PageElement => cy.get(`[data-test="visit-visitors-total-${type}"]`)

  bookedOnHeader = (): PageElement => cy.get('[data-test="header-booked-on"] > button')

  prisonerName = (index: number): PageElement => cy.get(`:nth-child(${index}) > [data-test="prisoner-name"]`)

  prisonerNumber = (index: number): PageElement => cy.get(`:nth-child(${index}) > [data-test="prisoner-number"]`)

  bookedOn = (index: number): PageElement => cy.get(`:nth-child(${index}) > [data-test="booked-on"]`)

  noResultsMessage = (): PageElement => cy.get('[data-test="no-visits-message"]')

  // another date form
  toggleChooseAnotherDatePopUp = (): void => {
    cy.get('[data-test="another-date-button"]').click()
  }

  viewSelectedDate = (): void => {
    cy.get('[data-test="submit"]').click()
  }
}
