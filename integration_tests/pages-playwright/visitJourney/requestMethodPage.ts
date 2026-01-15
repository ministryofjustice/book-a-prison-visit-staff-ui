import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class RequestMethodPage extends AbstractPage {
  readonly continueButton: Locator

  readonly header: Locator

  private constructor(page: Page, title: string) {
    super(page)
    this.continueButton = page.getByTestId('submit')
    this.header = page.locator('h1', { hasText: title })
  }

  static async verifyOnPage(page: Page, title: string): Promise<RequestMethodPage> {
    const requestMethodPage = new RequestMethodPage(page, title)
    await expect(requestMethodPage.header).toBeVisible()
    await requestMethodPage.verifyNoAccessViolationsOnPage()
    return requestMethodPage
  }

  getRequestMethodByValue(value: string): Locator {
    return this.page.locator(`input[value="${value}"]`)
  }

  getRequestLabelByValue(value: string): Locator {
    return this.page.locator(`input[value="${value}"] + label`)
  }
}
