import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class VisitOrdersHistoryPage extends AbstractPage {
  readonly header: Locator

  readonly prisonerName: Locator

  readonly prisonerCategory: Locator

  readonly prisonerConvictedStatus: Locator

  readonly prisonerIncentiveLevel: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Visiting orders history' })

    this.prisonerName = page.getByTestId('prisoner-name')
    this.prisonerCategory = page.getByTestId('prisoner-category')
    this.prisonerConvictedStatus = page.getByTestId('prisoner-convicted-status')
    this.prisonerIncentiveLevel = page.getByTestId('prisoner-incentive-level')
  }

  static async verifyOnPage(page: Page): Promise<VisitOrdersHistoryPage> {
    const bookerSearchPage = new VisitOrdersHistoryPage(page)
    await expect(bookerSearchPage.header).toBeVisible()
    return bookerSearchPage
  }

  date = (row: number): Locator => this.page.getByTestId(`date-${row}`)

  reason = (row: number): Locator => this.page.getByTestId(`reason-${row}`)

  voChange = (row: number): Locator => this.page.getByTestId(`vo-change-${row}`)

  voBalance = (row: number): Locator => this.page.getByTestId(`vo-balance-${row}`)

  pvoChange = (row: number): Locator => this.page.getByTestId(`pvo-change-${row}`)

  pvoBalance = (row: number): Locator => this.page.getByTestId(`pvo-balance-${row}`)
}
