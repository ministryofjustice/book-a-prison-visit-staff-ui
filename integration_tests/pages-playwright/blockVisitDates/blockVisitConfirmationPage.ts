import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class BlockVisitDateConfirmationPage extends AbstractPage {
  readonly header: Locator

  readonly noExistingBookingsMessage: Locator

  readonly yesRadio: Locator

  readonly continueButton: Locator

  private constructor(page: Page, date: string) {
    super(page)
    this.header = page.locator('h1', {
      hasText: `Are you sure you want to block visits on ${date}?`,
    })

    this.noExistingBookingsMessage = page.getByTestId('no-existing-bookings')
    this.yesRadio = page.locator('input[name=confirmBlockDate][value=yes]')
    this.continueButton = page.getByTestId('submit')
  }

  static async verifyOnPage(page: Page, date?: string): Promise<BlockVisitDateConfirmationPage> {
    const blockVisitDateConfirmationPage = new BlockVisitDateConfirmationPage(page, date)
    await expect(blockVisitDateConfirmationPage.header).toBeVisible()
    await blockVisitDateConfirmationPage.verifyNoAccessViolationsOnPage()
    return blockVisitDateConfirmationPage
  }

  async selectYes(): Promise<void> {
    await this.yesRadio.check()
  }

  async continue(): Promise<void> {
    await this.continueButton.click()
  }
}
