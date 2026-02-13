import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class EditVoBalancePage extends AbstractPage {
  readonly axeExcludedElements = [
    // Known issue with radio conditional reveal
    // See: https://github.com/alphagov/govuk-frontend/issues/979
    'input[aria-expanded]',
  ]

  readonly prisonerName: Locator

  readonly voBalance: Locator

  readonly pvoBalance: Locator

  readonly editBalanceButton: Locator

  constructor(page: Page) {
    super(page, 'Edit visiting orders balances')

    this.prisonerName = page.getByTestId('prisoner-name')
    this.voBalance = page.getByTestId('vo-balance')
    this.pvoBalance = page.getByTestId('pvo-balance')
    this.editBalanceButton = page.getByTestId('edit-balance')
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
