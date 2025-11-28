import { Locator, Page, expect } from '@playwright/test'

export default class DatePickerComponent {
  private page: Page

  private inputSelector = '.moj-js-datepicker-input'

  private toggleSelector = '.moj-js-datepicker-toggle'

  private cancelSelector = '.moj-js-datepicker-cancel'

  private daySelector = 'button.moj-datepicker__button.moj-datepicker__calendar-day'

  private prevMonthSelector = '.moj-js-datepicker-prev-month'

  private nextMonthSelector = '.moj-js-datepicker-next-month'

  private prevYearSelector = '.moj-js-datepicker-prev-year'

  private nextYearSelector = '.moj-js-datepicker-next-year'

  constructor(page: Page) {
    this.page = page
  }

  async enterDate(date: string): Promise<void> {
    await this.page.locator(this.cancelSelector).click({ force: true })
    const input = this.page.locator(this.inputSelector)
    await input.fill('')
    await input.type(date)
    await this.toggleCalendar()
  }

  getEnteredDate(): Locator {
    return this.page.locator(this.inputSelector)
  }

  // Select a specific day number
  async selectDay(day: number): Promise<void> {
    const dayButton = this.page.locator(this.daySelector, { hasText: new RegExp(`^${day}$`) }).first()

    await dayButton.waitFor({ state: 'visible' })
    await expect(dayButton).toBeEnabled()
    await dayButton.click()
  }

  // Select the first enabled day in the current visible calendar
  async selectFirstAvailableDay(): Promise<void> {
    const firstEnabled = this.page.locator(`${this.daySelector}:not([disabled])`).first()
    await firstEnabled.waitFor({ state: 'visible' })
    await firstEnabled.click()
  }

  async goToPreviousMonth(): Promise<void> {
    await this.page.locator(this.prevMonthSelector).click()
    await this.page.waitForTimeout(150)
  }

  async goToNextMonth(): Promise<void> {
    await this.page.locator(this.nextMonthSelector).click()
    await this.page.waitForTimeout(150)
  }

  async goToPreviousYear(): Promise<void> {
    await this.page.locator(this.prevYearSelector).click()
    await this.page.waitForTimeout(150)
  }

  async goToNextYear(): Promise<void> {
    await this.page.locator(this.nextYearSelector).click()
    await this.page.waitForTimeout(150)
  }

  async toggleCalendar(): Promise<void> {
    await this.page.locator(this.toggleSelector).click()
    await this.page.waitForTimeout(100) // allow calendar to render
  }
}
