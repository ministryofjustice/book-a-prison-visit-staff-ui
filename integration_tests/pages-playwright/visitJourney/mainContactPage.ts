import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class MainContactPage extends AbstractPage {
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
    super(page, 'Who is the main contact for this booking?')

    this.firstContact = page.locator('#contact')
    this.phoneNumberYesRadio = page.locator('#phoneNumber')
    this.phoneNumberInput = page.locator('#phoneNumberInput')
    this.emailInput = page.locator('#email')
    this.continueButton = page.getByTestId('submit')
  }

  async selectFirstContact(): Promise<void> {
    await this.firstContact.check()
  }

  async choosePhoneNumberYes(): Promise<void> {
    await this.phoneNumberYesRadio.click()
  }

  async enterPhoneNumber(phone: string): Promise<void> {
    await this.phoneNumberInput.fill(phone)
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email)
  }

  async continue(): Promise<void> {
    await this.continueButton.click()
  }
}
