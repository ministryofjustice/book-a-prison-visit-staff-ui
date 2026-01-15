import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class MainContactPage extends AbstractPage {
  readonly firstContact: Locator

  readonly phoneNumberYesRadio: Locator

  readonly phoneNumberInput: Locator

  readonly emailInput: Locator

  readonly continueButton: Locator

  readonly header: Locator

  private constructor(page: Page, title: string) {
    super(page)

    this.firstContact = page.locator('#contact')
    this.phoneNumberYesRadio = page.locator('#phoneNumber')
    this.phoneNumberInput = page.locator('#phoneNumberInput')
    this.emailInput = page.locator('#email')
    this.continueButton = page.getByTestId('submit')
    this.header = page.locator('h1', { hasText: title })
  }

  static async verifyOnPage(page: Page, title: string): Promise<MainContactPage> {
    const contactPage = new MainContactPage(page, title)
    await expect(contactPage.header).toBeVisible()
    // await contactPage.verifyNoAccessViolationsOnPage()
    return contactPage
  }
}
