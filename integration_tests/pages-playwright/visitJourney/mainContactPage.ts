import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class MainContactPage extends AbstractPage {
    readonly firstContact: Locator
    readonly phoneNumberYesRadio: Locator
    readonly phoneNumberInput: Locator
    readonly emailInput: Locator
    readonly continueButton: Locator

    private constructor(page: Page) {
        super(page)

        this.firstContact = page.locator('#contact')
        this.phoneNumberYesRadio = page.locator('#phoneNumber')
        this.phoneNumberInput = page.locator('#phoneNumberInput')
        this.emailInput = page.locator('#email')
        this.continueButton = page.getByTestId('submit')
    }

    static async verifyOnPage(page: Page): Promise<MainContactPage> {
        const contactPage = new MainContactPage(page)
        await expect(contactPage.firstContact).toBeVisible()
        return contactPage
    }
}
