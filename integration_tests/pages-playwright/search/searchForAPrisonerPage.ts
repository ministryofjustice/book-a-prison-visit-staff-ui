import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchForAPrisonerPage extends AbstractPage {
  static readonly title = 'Search for a prisoner'

  readonly searchForm: Locator

  readonly searchInput: Locator

  readonly searchButton: Locator

  constructor(page: Page) {
    super(page, SearchForAPrisonerPage.title)
    this.searchForm = page.locator('[action="/search/prisoner"]')
    this.searchInput = page.locator('.moj-search__input')
    this.searchButton = page.locator('.moj-search__button')
  }

  // Helper to perform a search
  async searchFor(prisonerNumber: string): Promise<void> {
    await this.searchInput.fill(prisonerNumber)
    await this.searchButton.click()
  }
}
