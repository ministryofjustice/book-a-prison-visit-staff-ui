import { PageElement } from '../pages/page'

export default class DatePickerComponent {
  enterDate = (date: string): void => {
    cy.get('.moj-js-datepicker-cancel').click({ force: true })
    cy.get('.moj-js-datepicker-input').clear()
    cy.get('.moj-js-datepicker-input').type(`${date}{enter}`)
    this.datePickerToggleCalendar()
  }

  getEnteredDate = (): PageElement => cy.get('.moj-js-datepicker-input')

  selectDay = (day: number) => {
    cy.get('.moj-datepicker__calendar-day:visible')
      .contains(new RegExp(`^${day}$`))
      .click()
  }

  goToPreviousMonth = (): void => {
    cy.get('.moj-js-datepicker-prev-month').click()
  }

  goToNextMonth = (): void => {
    cy.get('.moj-js-datepicker-next-month').click()
  }

  goToPreviousYear = (): void => {
    cy.get('.moj-js-datepicker-prev-year').click()
  }

  goToNextYear = (): void => {
    cy.get('.moj-js-datepicker-next-year').click()
  }

  datePickerToggleCalendar = (): void => {
    cy.get('.moj-js-datepicker-toggle').click()
  }
}
