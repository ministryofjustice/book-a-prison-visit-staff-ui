import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class BlockSessionConfirmPage extends AbstractPage {
  readonly sessionDetails: Locator

  readonly yesRadio: Locator

  readonly continueButton: Locator

  constructor(page: Page, date: string) {
    super(page, `Are you sure you want to block visits for this session on ${date}?`)

    this.sessionDetails = page.getByTestId('session-details')
    this.yesRadio = page.getByRole('radio', { name: 'Yes' })
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  async selectYes(): Promise<void> {
    await this.yesRadio.check()
  }

  async continue(): Promise<void> {
    await this.continueButton.click()
  }
}
