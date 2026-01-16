import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class EditVoBalancePage extends AbstractPage {
  readonly header: Locator

  readonly prisonerName: Locator

  readonly voBalance: Locator

  readonly pvoBalance: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Edit visiting orders balances' })

    this.prisonerName = page.getByTestId('prisoner-name')
    this.voBalance = page.getByTestId('vo-balance')
    this.pvoBalance = page.getByTestId('pvo-balance')
  }

  static async verifyOnPage(page: Page): Promise<EditVoBalancePage> {
    const editVoBalancePage = new EditVoBalancePage(page)
    await expect(editVoBalancePage.header).toBeVisible()

    // Known issue with radio conditional reveal. See: https://github.com/alphagov/govuk-frontend/issues/979
    await editVoBalancePage.verifyNoAccessViolationsOnPage({ exclude: ['input[aria-expanded]'] })
    return editVoBalancePage
  }

  changeBalance = async (type: 'VO' | 'PVO', action: 'Add' | 'Remove', amount: string): Promise<void> => {
    // select VO/PVO and Add/Remove radio (to open conditional reveal text input)
    await this.page
      .getByRole('group', { name: `What change should be made to the ${type} balance?` })
      .getByRole('radio', { name: action })
      .check()

    // enter VO/PVO change amount
    await this.page.getByRole('textbox', { name: `How many ${type}` }).fill(amount)
  }

  enterChangeReason = async (reason: string, details: string): Promise<void> => {
    // select adjustment reason
    await this.page.getByLabel(reason).check()
    // enter details
    await this.page.getByRole('textbox', { name: 'Provide details' }).fill(details)
  }
}
