import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class MainContactPage extends AbstractPage {
  readonly firstContact: Locator

  readonly phoneNumberYesRadio: Locator

  readonly phoneNumberInput: Locator

  readonly emailInput: Locator

  readonly continueButton: Locator

  constructor(page: Page, title: string) {
    super(page, title)

    this.firstContact = page.locator('#contact')
    this.phoneNumberYesRadio = page.locator('#phoneNumber')
    this.phoneNumberInput = page.locator('#phoneNumberInput')
    this.emailInput = page.locator('#email')
    this.continueButton = page.getByTestId('submit')
  }
}
