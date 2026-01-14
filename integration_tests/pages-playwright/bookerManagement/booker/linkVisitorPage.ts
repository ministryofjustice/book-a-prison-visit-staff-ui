import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class LinkVisitorPage extends AbstractPage {
  readonly header: Locator

  readonly visitorName: Locator

  readonly sendEmail: Locator

  readonly doNotSendEmail: Locator

  readonly submit: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Do you want to notify the booker?' })
    this.visitorName = page.getByTestId('visitor-name')
    this.sendEmail = page.getByRole('radio', { name: 'Yes, send an email' })
    this.doNotSendEmail = page.getByRole('radio', { name: 'No, do not email' })
    this.submit = page.getByRole('button', { name: 'Submit' })
  }

  static async verifyOnPage(page: Page): Promise<LinkVisitorPage> {
    const linkVisitorPage = new LinkVisitorPage(page)
    await expect(linkVisitorPage.header).toBeVisible()
    await linkVisitorPage.verifyNoAccessViolationsOnPage()
    return linkVisitorPage
  }
}
