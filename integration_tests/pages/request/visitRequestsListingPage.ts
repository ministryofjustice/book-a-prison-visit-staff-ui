import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class VisitRequestsListingPage extends AbstractPage {
  constructor(page: Page) {
    super(page, 'Requested visits')
  }

  getVisitDate = (row: number): Locator => this.page.getByTestId(`visit-date-${row}`)

  getVisitRequestedDate = (row: number): Locator => this.page.getByTestId(`visit-requested-date-${row}`)

  getPrisonerName = (row: number): Locator => this.page.getByTestId(`prisoner-name-${row}`)

  getPrisonNumber = (row: number): Locator => this.page.getByTestId(`prison-number-${row}`)

  getMainContact = (row: number): Locator => this.page.getByTestId(`main-contact-${row}`)

  getAction = (row: number): Locator => this.page.locator(`[data-test="action-${row}"] a`)

  getNoRequestsMessage = (): Locator => this.page.getByTestId('no-visit-requests')

  getBeforeDaysMessage = (): Locator => this.page.getByTestId('check-before-days')
}
