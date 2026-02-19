import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CheckYourBookingPage extends AbstractPage {
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

  readonly changeVisitors: Locator

  constructor(page: Page) {
    super(page, 'Check the visit details before booking')

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
    this.changeVisitors = page.getByTestId('change-visitors')
  }

  visitorName(index: number): Locator {
    return this.page.locator(`.test-visitor-name${index}`)
  }

  async submitBooking(): Promise<void> {
    await this.submitButton.click()
  }
}
