import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class AdditionalSupportPage extends AbstractPage {
  readonly additionalSupportRequired: Locator

  readonly additionalSupportNotRequired: Locator

  readonly additionalSupportInput: Locator

  readonly continueButton: Locator

  readonly header: Locator

  private constructor(page: Page, title: string) {
    super(page)

    this.additionalSupportRequired = page.locator('[data-test=support-required-yes]')
    this.additionalSupportNotRequired = page.locator('[data-test=support-required-no]')
    this.additionalSupportInput = page.locator('#additionalSupport')
    this.continueButton = page.getByTestId('submit')
    this.header = page.locator('h1', { hasText: title })
  }

  static async verifyOnPage(page: Page, title: string): Promise<AdditionalSupportPage> {
    const supportPage = new AdditionalSupportPage(page, title)
    await expect(supportPage.header).toBeVisible()
    // await supportPage.verifyNoAccessViolationsOnPage()

    return supportPage
  }
}
