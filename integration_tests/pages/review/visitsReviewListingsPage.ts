import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class VisitsReviewListingPage extends AbstractPage {
  constructor(page: Page) {
    super(page, 'Visits that need review')
  }

  // Filters
  async filterByUser(username: string): Promise<void> {
    await this.page.locator('#button-bookedBy').click()
    await this.page.locator(`[data-test="${username}"]`).check()
  }

  async filterByReason(type: string): Promise<void> {
    await this.page.locator('#button-type').click()
    await this.page.locator(`[data-test="${type}"]`).check()
  }

  async applyFilter(): Promise<void> {
    await this.page.locator('[data-test="bapv-filter-apply"]').click()
  }

  async clearFilters(): Promise<void> {
    await this.page.locator('#reset-filters').click()
  }

  async removeFilter(label: string): Promise<void> {
    await this.page.locator('.moj-filter__tag', { hasText: label }).click()
  }

  // Table rows
  getBookingsRows(): Locator {
    return this.page.locator('[data-test="bookings-list"] tbody tr')
  }

  getPrisonerNumber(row: number): Locator {
    return this.page.getByTestId(`prisoner-number-${row}`)
  }

  getVisitDate(row: number): Locator {
    return this.page.getByTestId(`visit-date-${row}`)
  }

  getBookedBy(row: number): Locator {
    return this.page.getByTestId(`booked-by-${row}`)
  }

  getTypes(row: number): Locator {
    return this.page.getByTestId(`type-${row}`)
  }

  getActionLink(row: number): Locator {
    return this.page.locator(`[data-test="action-${row}"] a`)
  }
}
