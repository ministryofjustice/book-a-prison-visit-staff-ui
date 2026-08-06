import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ChooseDateOrSessionBlockPage extends AbstractPage {
  readonly singleSessionRadio: Locator

  readonly continueButton: Locator

  constructor(page: Page, date: string) {
    super(page, `What would you like to block on ${date}?`)

    this.singleSessionRadio = page.getByRole('radio', { name: 'A single session' })
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  async selectSingleSession(): Promise<void> {
    await this.singleSessionRadio.check()
  }

  async continue(): Promise<void> {
    await this.continueButton.click()
  }
}
