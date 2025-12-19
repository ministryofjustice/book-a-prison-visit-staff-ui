import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class BookerSearchPage extends AbstractPage {
  readonly header: Locator

  readonly emailInput: Locator

  readonly search: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Manage online bookers' })
    this.emailInput = page.getByRole('textbox', { name: 'Enter the booker’s email' })
    this.search = page.getByRole('button', { name: 'Search' })
  }

  static async verifyOnPage(page: Page): Promise<BookerSearchPage> {
    const bookerSearchPage = new BookerSearchPage(page)
    await expect(bookerSearchPage.header).toBeVisible()
    return bookerSearchPage
  }
}
