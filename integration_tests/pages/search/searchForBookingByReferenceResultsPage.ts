import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchForBookingByReferenceResultsPage extends AbstractPage {
  readonly visitReference: Locator

  readonly visitReferenceLink: Locator

  readonly prisonerName: Locator

  readonly prisonerNumber: Locator

  readonly visitStatus: Locator

  constructor(page: Page) {
    super(page, 'Search for a booking')

    this.visitReference = page.getByTestId('visit-reference')
    this.visitReferenceLink = this.visitReference.getByRole('link')

    this.prisonerName = page.getByTestId('prisoner-name')
    this.prisonerNumber = page.getByTestId('prisoner-number')
    this.visitStatus = page.getByTestId('visit-status')
  }
}
