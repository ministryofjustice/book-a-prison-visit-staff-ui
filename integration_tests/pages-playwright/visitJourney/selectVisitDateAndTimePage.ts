import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectVisitDateAndTimePage extends AbstractPage {
  static readonly title = 'Select date and time of visit'

  readonly visitRestriction: Locator

  readonly continueButton: Locator

  constructor(page: Page) {
    super(page, SelectVisitDateAndTimePage.title)
    this.visitRestriction = page.getByTestId('visit-restriction')
    this.continueButton = page.getByTestId('submit')
  }

  // Dynamic locators for calendar days
  clickCalendarDay(date: string): Locator {
    return this.page.locator(`#day-link-${date}`)
  }

  // Dynamic locators for visit sessions
  getSessionLabel(date: string, index: number): Locator {
    return this.page.locator(`#day-group-${date} input`).nth(index).locator('xpath=following-sibling::label')
  }

  selectSession(date: string, index: number): Locator {
    return this.page.locator(`#day-group-${date} input`).nth(index)
  }
}
