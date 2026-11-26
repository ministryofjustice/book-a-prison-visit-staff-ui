import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class PrisonerListPage extends AbstractPage {
  readonly continueButton: Locator

  constructor(page: Page) {
    super(page, 'Select a prisoner')

    this.continueButton = page.getByTestId('continue-button')
  }

  prisonerName = (index: number): Locator => this.page.getByTestId(`prisoner-${index}-prisoner-name`)

  prisonNumber = (index: number): Locator => this.page.getByTestId(`prisoner-${index}-prison-number`)

  prisonerDob = (index: number): Locator => this.page.getByTestId(`prisoner-${index}-dob`)

  selectPrisoner = (name: string): Locator => this.page.getByRole('radio', { name: `Select ${name}` })
}
