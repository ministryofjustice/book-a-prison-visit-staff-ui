import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectVisitTypePage extends AbstractPage {
  readonly submitButton: Locator

  private constructor(page: Page) {
    super(page)
    this.submitButton = page.getByTestId('submit')
  }

  static async verifyOnPage(page: Page): Promise<SelectVisitTypePage> {
    const visitTypePage = new SelectVisitTypePage(page)
    await expect(visitTypePage.submitButton).toBeVisible()
    return visitTypePage
  }

  getPrisonerRestrictionType(index: number): Locator {
    return this.page.locator(`.prisoner-restrictions .test-restrictions-type${index}`)
  }

  selectOpenVisitType(): void {
    this.page.locator('[data-test="visit-type-open"]').check()
  }

  selectClosedVisitType(): void {
    this.page.locator('[data-test="visit-type-closed"]').check()
  }
}
