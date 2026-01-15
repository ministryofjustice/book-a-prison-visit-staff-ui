import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchForAPrisonerPage extends AbstractPage {
  readonly searchForm: Locator

  readonly searchInput: Locator

  readonly searchButton: Locator

  readonly header: Locator

  private constructor(page: Page, title: string) {
    super(page)
    this.searchForm = page.locator('[action="/search/prisoner"]')
    this.searchInput = page.locator('.moj-search__input')
    this.searchButton = page.locator('.moj-search__button')
    this.header = page.locator('h1', { hasText: title })
  }

  static async verifyOnPage(page: Page, title: string): Promise<SearchForAPrisonerPage> {
    const searchPage = new SearchForAPrisonerPage(page, title)
    await expect(searchPage.header).toBeVisible()
    await searchPage.verifyNoAccessViolationsOnPage()
    return searchPage
  }

  // Helper to perform a search
  async searchFor(prisonerNumber: string): Promise<void> {
    await this.searchInput.fill(prisonerNumber)
    await this.searchButton.click()
  }
}
