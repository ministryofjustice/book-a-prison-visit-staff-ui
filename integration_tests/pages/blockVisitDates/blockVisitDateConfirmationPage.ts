import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class BlockVisitDateConfirmationPage extends AbstractPage {
  readonly noExistingBookingsMessage: Locator

  readonly yesRadio: Locator

  readonly continueButton: Locator

  constructor(page: Page, date: string) {
    super(page, `Are you sure you want to block visits on ${date}?`)

    this.noExistingBookingsMessage = page.getByTestId('no-existing-bookings')
    this.yesRadio = page.locator('input[name=confirmBlockDate][value=yes]')
    this.continueButton = page.getByTestId('submit')
  }

  async selectYes(): Promise<void> {
    await this.yesRadio.check()
  }

  async continue(): Promise<void> {
    await this.continueButton.click()
  }
}
