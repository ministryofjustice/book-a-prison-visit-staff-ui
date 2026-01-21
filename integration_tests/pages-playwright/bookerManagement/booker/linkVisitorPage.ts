import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class LinkVisitorPage extends AbstractPage {
  readonly visitorName: Locator

  readonly sendEmail: Locator

  readonly doNotSendEmail: Locator

  readonly submit: Locator

  constructor(page: Page) {
    super(page, 'Do you want to notify the booker?')

    this.visitorName = page.getByTestId('visitor-name')
    this.sendEmail = page.getByRole('radio', { name: 'Yes, send an email' })
    this.doNotSendEmail = page.getByRole('radio', { name: 'No, do not email' })
    this.submit = page.getByRole('button', { name: 'Submit' })
  }
}
