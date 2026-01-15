import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectVisitDateAndTimePage extends AbstractPage {
  readonly visitRestriction: Locator

  readonly continueButton: Locator

  readonly header: Locator

  private constructor(page: Page, title: string) {
    super(page)
    this.visitRestriction = page.locator('[data-test="visit-restriction"]')
    this.continueButton = page.getByTestId('submit')
    this.header = page.locator('h1', { hasText: title })
  }

  static async verifyOnPage(page: Page, title: string): Promise<SelectVisitDateAndTimePage> {
    const visitPage = new SelectVisitDateAndTimePage(page, title)
    await expect(visitPage.header).toBeVisible()
    await visitPage.verifyNoAccessViolationsOnPage()
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
