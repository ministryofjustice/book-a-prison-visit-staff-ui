import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class AdditionalSupportPage extends AbstractPage {
  static readonly title = 'Is additional support needed for any of the visitors?'

  readonly axeExcludedElements = [
    // Known issue with radio conditional reveal
    // See: https://github.com/alphagov/govuk-frontend/issues/979
    'input[aria-expanded]',
  ]

  readonly additionalSupportRequired: Locator

  readonly additionalSupportNotRequired: Locator

  readonly additionalSupportInput: Locator

  readonly continueButton: Locator

  constructor(page: Page) {
    super(page, AdditionalSupportPage.title)

    this.additionalSupportRequired = page.getByTestId('support-required-yes')
    this.additionalSupportNotRequired = page.getByTestId('support-required-no')
    this.additionalSupportInput = page.locator('#additionalSupport')
    this.continueButton = page.getByTestId('submit')
  }
}
