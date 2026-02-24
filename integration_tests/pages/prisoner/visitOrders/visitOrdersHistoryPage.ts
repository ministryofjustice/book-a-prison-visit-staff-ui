import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class VisitOrdersHistoryPage extends AbstractPage {
  readonly prisonerName: Locator

  readonly prisonerCategory: Locator

  readonly prisonerConvictedStatus: Locator

  readonly prisonerIncentiveLevel: Locator

  constructor(page: Page) {
    super(page, 'Visiting orders history')

    this.prisonerName = page.getByTestId('prisoner-name')
    this.prisonerCategory = page.getByTestId('prisoner-category')
    this.prisonerConvictedStatus = page.getByTestId('prisoner-convicted-status')
    this.prisonerIncentiveLevel = page.getByTestId('prisoner-incentive-level')
  }

  date = (row: number): Locator => this.page.getByTestId(`date-${row}`)

  reason = (row: number): Locator => this.page.getByTestId(`reason-${row}`)

  voChange = (row: number): Locator => this.page.getByTestId(`vo-change-${row}`)

  voBalance = (row: number): Locator => this.page.getByTestId(`vo-balance-${row}`)

  pvoChange = (row: number): Locator => this.page.getByTestId(`pvo-change-${row}`)

  pvoBalance = (row: number): Locator => this.page.getByTestId(`pvo-balance-${row}`)
}
