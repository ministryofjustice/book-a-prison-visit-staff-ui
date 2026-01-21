import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectBookerAccountPage extends AbstractPage {
  readonly continue: Locator

  constructor(page: Page) {
    super(page, 'Select account to manage')

    this.continue = page.getByRole('button', { name: 'Continue' })
  }
}
