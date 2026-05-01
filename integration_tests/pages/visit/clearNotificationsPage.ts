import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ClearNotificationsPage extends AbstractPage {
  // Known issue with radio conditional reveal
  // See: https://github.com/alphagov/govuk-frontend/issues/979
  readonly axeExcludedElements = ['input[aria-expanded]']

  readonly yesRadio: Locator

  readonly reasonInput: Locator

  readonly submitButton: Locator

  constructor(page: Page) {
    super(page, 'Are you sure the visit does not need to be updated or cancelled?')

    this.yesRadio = page.getByTestId('clear-notification-yes')
    this.reasonInput = page.locator('#clearReason')
    this.submitButton = page.getByTestId('submit')
  }

  async selectYes(): Promise<void> {
    await this.yesRadio.check()
  }

  async enterReason(reason: string): Promise<void> {
    await this.reasonInput.fill(reason)
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }
}
