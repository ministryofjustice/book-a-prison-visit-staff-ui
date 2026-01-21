import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class RequestMethodPage extends AbstractPage {
  static readonly title = 'How was this booking requested?'

  readonly continueButton: Locator

  constructor(page: Page) {
    super(page, RequestMethodPage.title)
    this.continueButton = page.getByTestId('submit')
  }

  getRequestMethodByValue(value: string): Locator {
    return this.page.locator(`input[value="${value}"]`)
  }

  getRequestLabelByValue(value: string): Locator {
    return this.page.locator(`input[value="${value}"] + label`)
  }
}
