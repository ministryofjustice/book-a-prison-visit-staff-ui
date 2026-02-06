import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchForBookingByPrisonerPage extends AbstractPage {
  readonly searchInput: Locator

  readonly searchByReferenceLink: Locator

  readonly continueButton: Locator

  constructor(page: Page) {
    super(page, 'Search for a prisoner')

    this.searchInput = page.locator('#search')
    this.searchByReferenceLink = page.getByTestId('search-by-reference')
    this.continueButton = page.getByRole('button', { name: 'Search' })
  }

  async enterSearchTerm(term: string): Promise<void> {
    await this.searchInput.fill(term)
  }

  async clickSearchByReference(): Promise<void> {
    await this.searchByReferenceLink.click()
  }

  async continue(): Promise<void> {
    await this.continueButton.click()
  }
}
