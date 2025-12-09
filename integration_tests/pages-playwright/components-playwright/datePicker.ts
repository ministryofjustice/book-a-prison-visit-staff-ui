import { Locator, Page } from '@playwright/test'

export default class DatePickerComponent {
  constructor(private page: Page) {}

  private inputSelector = '.moj-js-datepicker-input'

  private toggleSelector = '.moj-js-datepicker-toggle'

  private cancelSelector = '.moj-js-datepicker-cancel'

  private daySelector = 'button.moj-datepicker__button.moj-datepicker__calendar-day:visible'

  private prevMonthSelector = '.moj-js-datepicker-prev-month'

  private nextMonthSelector = '.moj-js-datepicker-next-month'

  private prevYearSelector = '.moj-js-datepicker-prev-year'

  private nextYearSelector = '.moj-js-datepicker-next-year'

  // private calendarDialogSelector = 'dialog[role="dialog"]'

  /** Enter date manually into the input */
  async enterDate(date: string): Promise<void> {
    const cancelBtn = this.page.locator(this.cancelSelector)
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click({ force: true })
    }
    const input = this.page.locator(this.inputSelector)
    await input.fill('')
    await input.fill(date)
    await this.toggleCalendar()
  }

  getEnteredDate(): Locator {
    return this.page.locator(this.inputSelector)
  }

  async toggleCalendar(): Promise<void> {
    const calendarTitle = this.page.locator('#datepicker-title-date')

    // Only click toggle if the calendar is not visible
    if (!(await calendarTitle.isVisible())) {
      // Click the toggle button to open the calendar
      await this.page.locator(this.toggleSelector).click({ force: true })

      // Wait for the title of the calendar to appear, indicating that the dialog is visible
      await calendarTitle.waitFor({ state: 'visible', timeout: 5000 })
    }
  }

  /** Navigate calendar */
  async goToPreviousMonth(): Promise<void> {
    await this.page.locator(this.prevMonthSelector).click()
  }

  async goToPreviousYear(): Promise<void> {
    await this.page.locator(this.prevYearSelector).click()
  }

  async goToNextYear(): Promise<void> {
    await this.page.locator(this.nextYearSelector).click()
  }

  async selectDay(day: number): Promise<void> {
    const dayButton = this.page.locator(this.daySelector, { hasText: `${day}` }).first()

    // Wait for the button to be visible (this is crucial in case the calendar takes time to render)
    await dayButton.waitFor({ state: 'visible', timeout: 10000 })

    // Simply click on the button
    await dayButton.click()
  }

  async goToNextMonth(): Promise<void> {
    const btn = this.page.locator(this.nextMonthSelector)
    await btn.waitFor({ state: 'visible' })
    await btn.click()
  }
}
