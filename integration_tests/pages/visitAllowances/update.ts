import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class UpdateVisitAllowancesPage extends AbstractPage {
  readonly submitFromButton: Locator

  constructor(page: Page) {
    super(page, 'Visit allowances for unconvicted prisoners')

    this.submitFromButton = page.getByTestId('submit')
  }

  enterRemandLimit = (limit: string): Promise<void> => this.page.getByRole('textbox').fill(limit)

  selectDay = (day: string): Promise<void> => this.page.getByRole('radio', { name: day }).click()

  getIncentiveLevel(index: number): Locator {
    return this.page.getByTestId(`incentive-level-${index}`)
  }

  getVoCount(index: number): Locator {
    return this.page.getByTestId(`vo-count-${index}`)
  }

  getPvoCount(index: number): Locator {
    return this.page.getByTestId(`pvo-count-${index}`)
  }

  async submitForm(): Promise<void> {
    await this.submitFromButton.click()
  }
}
