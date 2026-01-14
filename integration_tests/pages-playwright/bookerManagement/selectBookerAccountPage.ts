import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectBookerAccountPage extends AbstractPage {
  readonly header: Locator

  readonly continue: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Select account to manage' })
    this.continue = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<SelectBookerAccountPage> {
    const selectBookerAccountPage = new SelectBookerAccountPage(page)
    await expect(selectBookerAccountPage.header).toBeVisible()
    await selectBookerAccountPage.verifyNoAccessViolationsOnPage()
    return selectBookerAccountPage
  }
}
