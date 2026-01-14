import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchForAPrisonerPage extends AbstractPage {
  readonly searchForm: Locator

  readonly searchInput: Locator

  readonly searchButton: Locator

  private constructor(page: Page) {
    super(page)
    this.searchForm = page.locator('[action="/search/prisoner"]')
    this.searchInput = page.locator('.moj-search__input')
    this.searchButton = page.locator('.moj-search__button')
  }

  static async verifyOnPage(page: Page): Promise<SearchForAPrisonerPage> {
    const searchPage = new SearchForAPrisonerPage(page)
    // Page-specific checks
    await expect(searchPage.searchForm).toBeVisible()
    await expect(searchPage.searchInput).toBeVisible()
    await expect(searchPage.searchButton).toBeVisible()

    return searchPage
  }

  // Helper to perform a search
  async searchFor(prisonerNumber: string): Promise<void> {
    await this.searchInput.fill(prisonerNumber)
    await this.searchButton.click()
  }
}
