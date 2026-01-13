import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class RequestMethodPage extends AbstractPage {
  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.continueButton = page.getByTestId('submit')
  }

  static async verifyOnPage(page: Page): Promise<RequestMethodPage> {
    const requestMethodPage = new RequestMethodPage(page)
    await expect(requestMethodPage.continueButton).toBeVisible()
    return requestMethodPage
  }

  getRequestMethodByValue(value: string): Locator {
    return this.page.locator(`input[value="${value}"]`)
  }

  getRequestLabelByValue(value: string): Locator {
    return this.page.locator(`input[value="${value}"] + label`)
  }
}
