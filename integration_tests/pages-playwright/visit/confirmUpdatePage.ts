import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ConfirmUpdatePage extends AbstractPage {
  readonly confirmUpdateYesRadio: Locator

  readonly submitButton: Locator

  constructor(page: Page) {
    super(page, 'This visit is in less than 2 days. Do you want to update the booking?')

    // Yes radio
    this.confirmUpdateYesRadio = page.locator('#confirmUpdate')

    // Submit button
    this.submitButton = page.getByTestId('submit')
  }

  async confirmUpdate(): Promise<void> {
    await this.confirmUpdateYesRadio.click()
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }
}
