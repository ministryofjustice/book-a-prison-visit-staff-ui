import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchForAPrisonerPage extends AbstractPage {
  readonly searchInput: Locator

  readonly searchButton: Locator

  constructor(page: Page) {
    super(page, 'Search for a prisoner')
    this.searchInput = page.getByRole('searchbox', { name: 'Enter name or prison number' })
    this.searchButton = page.getByRole('button', { name: 'Search' })
  }

  // Helper to perform a search
  async searchFor(prisonerNumber: string): Promise<void> {
    await this.searchInput.fill(prisonerNumber)
    await this.searchButton.click()
  }
}
