import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class AdditionalSupportPage extends AbstractPage {
  readonly additionalSupportRequired: Locator

  readonly additionalSupportNotRequired: Locator

  readonly additionalSupportInput: Locator

  readonly continueButton: Locator

  constructor(page: Page, title: string) {
    super(page, title)

    this.additionalSupportRequired = page.locator('[data-test=support-required-yes]')
    this.additionalSupportNotRequired = page.locator('[data-test=support-required-no]')
    this.additionalSupportInput = page.locator('#additionalSupport')
    this.continueButton = page.getByTestId('submit')
  }
}
