import { format } from 'date-fns'
import Page, { PageElement } from '../page'

export default class VisitTimetablePage extends Page {
  constructor() {
    super('Visits timetable')
  }

  checkSelectedDate = (date: Date): void => {
    cy.get('#selected-date').contains(format(date, 'EEEE d MMMM yyyy'))
    cy.get('.bapv-timetable-dates__date--selected').contains(format(date, 'EE d MMMM yyyy'))
  }

  goToDay = (dayIndex: number): void => {
    cy.get('.bapv-timetable-dates__date').eq(dayIndex).children('a').first().click()
  }

  goToPreviousWeek = (): void => {
    cy.get('[data-test="previous-week"]').click()
  }

  goToNextWeek = (): void => {
    cy.get('[data-test="next-week"]').click()
  }

  scheduleTime = (row: number): PageElement => cy.get(`[data-test="schedule-time-${row}"]`)

  scheduleType = (row: number): PageElement => cy.get(`[data-test="schedule-type-${row}"]`)

  scheduleCapacity = (row: number): PageElement => cy.get(`[data-test="schedule-capacity-${row}"]`)

  scheduleAttendees = (row: number): PageElement => cy.get(`[data-test="schedule-attendees-${row}"]`)

  scheduleFrequency = (row: number): PageElement => cy.get(`[data-test="schedule-frequency-${row}"]`)

  scheduleEndDate = (row: number): PageElement => cy.get(`[data-test="schedule-end-date-${row}"]`)

  emptySchedule = (): PageElement => cy.get('[data-test="empty-schedule"]')

  requestChangeLink = (): PageElement => cy.get('[data-test="change-request"]')
}
