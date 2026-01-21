import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class MainContactPage extends AbstractPage {
  static readonly title = 'Who is the main contact for this booking?'

  readonly axeExcludedElements = [
    // Known issue with radio conditional reveal
    // See: https://github.com/alphagov/govuk-frontend/issues/979
    'input[aria-expanded]',
  ]

  readonly firstContact: Locator

  readonly phoneNumberYesRadio: Locator

  readonly phoneNumberInput: Locator

  readonly emailInput: Locator

  readonly continueButton: Locator

  constructor(page: Page) {
    super(page, MainContactPage.title)

    this.firstContact = page.locator('#contact')
    this.phoneNumberYesRadio = page.locator('#phoneNumber')
    this.phoneNumberInput = page.locator('#phoneNumberInput')
    this.emailInput = page.locator('#email')
    this.continueButton = page.getByTestId('submit')
  }
}
