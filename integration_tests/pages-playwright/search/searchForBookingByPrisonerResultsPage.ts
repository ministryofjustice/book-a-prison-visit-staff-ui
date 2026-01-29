import { type Locator, type Page, expect } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchForBookingByPrisonerResultsPage extends AbstractPage {
  readonly resultRows: Locator

  readonly prisonerLink: Locator

  constructor(page: Page) {
    super(page, 'Search for a prisoner')
    this.resultRows = page.locator('.govuk-table__row').nth(1)
    this.prisonerLink = page.locator('.govuk-table__row > :nth-child(1) > a')
  }

  async selectFirstPrisoner(): Promise<void> {
    await this.prisonerLink.first().click()
  }

  async expectFirstRowContains(text: string): Promise<void> {
    await expect(this.resultRows.first()).toContainText(text)
  }

  async expectPrisonerLinkContains(text: string): Promise<void> {
    await expect(this.prisonerLink.first()).toContainText(text)
  }
}
