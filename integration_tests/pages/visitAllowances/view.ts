import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ViewVisitAllowancesPage extends AbstractPage {
  readonly changeAllowanceButton: Locator

  constructor(page: Page) {
    super(page, 'Visit allowances')

    this.changeAllowanceButton = page.getByTestId('change-allowance')
  }

  getRemandLimit = (): Locator => this.page.getByTestId('remand-limit')

  getWeekStartDay = (): Locator => this.page.getByTestId('week-start-day')

  getIncentiveLevel(index: number): Locator {
    return this.page.getByTestId(`incentive-level-${index}`)
  }

  getVoCount(index: number): Locator {
    return this.page.getByTestId(`vo-count-${index}`)
  }

  getPvoCount(index: number): Locator {
    return this.page.getByTestId(`pvo-count-${index}`)
  }

  async changeAllowance(): Promise<void> {
    await this.changeAllowanceButton.click()
  }
}
