import { format } from 'date-fns'
import { type Locator, type Page, expect } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class VisitTimetablePage extends AbstractPage {
  readonly selectedDate: Locator

  readonly selectedDateShort: Locator

  readonly dates: Locator

  readonly previousWeek: Locator

  readonly nextWeek: Locator

  readonly emptySchedule: Locator

  readonly requestChangeLink: Locator

  constructor(page: Page) {
    super(page, 'Visits timetable')

    this.selectedDate = page.locator('#selected-date')
    this.selectedDateShort = page.locator('.bapv-timetable-dates__date--selected')
    this.dates = page.locator('.bapv-timetable-dates__date')
    this.previousWeek = page.getByTestId('previous-week')
    this.nextWeek = page.getByTestId('next-week')
    this.emptySchedule = page.getByTestId('empty-schedule')
    this.requestChangeLink = page.getByTestId('change-request')
  }

  async checkSelectedDate(date: Date): Promise<void> {
    await expect(this.selectedDate).toContainText(format(date, 'EEEE d MMMM yyyy'))
    await expect(this.selectedDateShort).toContainText(format(date, 'EE d MMMM yyyy'))
  }

  async goToDay(dayIndex: number): Promise<void> {
    await this.dates.nth(dayIndex).locator('a').first().click()
  }

  async goToPreviousWeek(): Promise<void> {
    await this.previousWeek.click()
  }

  async goToNextWeek(): Promise<void> {
    await this.nextWeek.click()
  }

  scheduleTime(row: number): Locator {
    return this.page.getByTestId(`schedule-time-${row}`)
  }

  scheduleType(row: number): Locator {
    return this.page.getByTestId(`schedule-type-${row}`)
  }

  scheduleCapacity(row: number): Locator {
    return this.page.getByTestId(`schedule-capacity-${row}`)
  }

  scheduleAttendees(row: number): Locator {
    return this.page.getByTestId(`schedule-attendees-${row}`)
  }

  scheduleFrequency(row: number): Locator {
    return this.page.getByTestId(`schedule-frequency-${row}`)
  }

  scheduleEndDate(row: number): Locator {
    return this.page.getByTestId(`schedule-end-date-${row}`)
  }
}
