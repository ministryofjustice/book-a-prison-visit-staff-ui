import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class RequestMethodPage extends AbstractPage {
  readonly continueButton: Locator

  constructor(page: Page, title: string) {
    super(page, title)
    this.continueButton = page.getByTestId('submit')
  }

  getRequestMethodByValue(value: string): Locator {
    return this.page.locator(`input[value="${value}"]`)
  }

  getRequestLabelByValue(value: string): Locator {
    return this.page.locator(`input[value="${value}"] + label`)
  }
}
