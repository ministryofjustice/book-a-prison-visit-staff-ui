import { type Locator, type Page, expect } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchForBookingByPrisonerResultsPage extends AbstractPage {
  readonly resultRows: Locator

  readonly prisonerLinks: Locator

  constructor(page: Page) {
    super(page, 'Search for a prisoner')

    // All data rows
    this.resultRows = page.getByRole('row').filter({
      has: page.getByRole('link'),
    })

    // Prisoner name links inside rows
    this.prisonerLinks = this.resultRows.getByRole('link')
  }

  async selectFirstPrisoner(): Promise<void> {
    await this.prisonerLinks.first().click()
  }

  async expectFirstRowContains(text: string): Promise<void> {
    await expect(this.resultRows.first()).toContainText(text)
  }

  async expectPrisonerLinkContains(text: string): Promise<void> {
    await expect(this.prisonerLinks.first()).toContainText(text)
  }
}
