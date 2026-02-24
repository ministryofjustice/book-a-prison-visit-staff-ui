import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class VisitCancelledPage extends AbstractPage {
  readonly visitDetails: Locator

  readonly homeButton: Locator

  readonly contactMethodText: Locator

  constructor(page: Page) {
    super(page, 'Booking cancelled')

    this.visitDetails = page.getByTestId('visit-details')
    this.homeButton = page.getByTestId('back-to-start')
    this.contactMethodText = page.getByTestId('contact-method-text')
  }
}
