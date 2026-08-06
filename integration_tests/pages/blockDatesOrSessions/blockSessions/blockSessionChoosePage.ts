import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class BlockSessionChoosePage extends AbstractPage {
  readonly session: Locator

  readonly continueButton: Locator

  constructor(page: Page, date: string) {
    super(page, `Which session would you like to block on ${date}?`)

    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  async selectSession(name: string): Promise<void> {
    await this.page.getByRole('radio', { name }).check()
  }

  async continue(): Promise<void> {
    await this.continueButton.click()
  }
}
