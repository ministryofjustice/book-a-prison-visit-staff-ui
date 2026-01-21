import { type Locator, type Page, expect } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CheckYourBookingPage extends AbstractPage {
  static readonly title = 'Check the visit details before booking'

  readonly prisonerName: Locator

  readonly visitDate: Locator

  readonly changeVisitDate: Locator

  readonly visitTime: Locator

  readonly visitType: Locator

  readonly additionalSupport: Locator

  readonly changeAdditionalSupport: Locator

  readonly mainContactName: Locator

  readonly mainContactNumber: Locator

  readonly mainContactEmail: Locator

  readonly changeMainContact: Locator

  readonly requestMethod: Locator

  readonly changeRequestMethod: Locator

  readonly submitButton: Locator

  constructor(page: Page) {
    super(page, CheckYourBookingPage.title)

    this.prisonerName = page.locator('.test-prisoner-name')
    this.visitDate = page.locator('.test-visit-date')
    this.changeVisitDate = page.getByTestId('change-date')
    this.visitTime = page.locator('.test-visit-time')
    this.visitType = page.locator('.test-visit-type')

    this.additionalSupport = page.locator('.test-additional-support')
    this.changeAdditionalSupport = page.getByTestId('change-additional-support')

    this.mainContactName = page.locator('.test-main-contact-name')
    this.mainContactNumber = page.locator('.test-main-contact-number')
    this.mainContactEmail = page.locator('.test-main-contact-email')
    this.changeMainContact = page.getByTestId('change-main-contact')

    this.requestMethod = page.locator('.test-request-method')
    this.changeRequestMethod = page.getByTestId('change-request-method')

    this.submitButton = page.getByTestId('submit')
  }

  async clickDisabledOnSubmitButton() {
    // Wait for button to be attached and visible first
    await expect(this.submitButton).toBeVisible()

    // Click the button, then assert it is disabled before navigation
    await Promise.all([
      this.page.waitForTimeout(100), // tiny wait to let JS disable it
      this.submitButton.click(),
    ])

    // Only check disabled if it still exists
    if ((await this.submitButton.count()) > 0) {
      await expect(this.submitButton).toBeDisabled({ timeout: 1000 })
    }
  }

  visitorName(index: number): Locator {
    return this.page.locator(`.test-visitor-name${index}`)
  }
}
