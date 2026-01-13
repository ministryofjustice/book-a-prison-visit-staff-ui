import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectVisitDateAndTime extends AbstractPage {
  readonly visitRestriction: Locator
  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.visitRestriction = page.locator('[data-test="visit-restriction"]')
    this.continueButton = page.getByTestId('submit')
  }

  static async verifyOnPage(page: Page): Promise<SelectVisitDateAndTime> {
    const visitPage = new SelectVisitDateAndTime(page)
    await expect(visitPage.visitRestriction).toBeVisible()
    return visitPage
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
