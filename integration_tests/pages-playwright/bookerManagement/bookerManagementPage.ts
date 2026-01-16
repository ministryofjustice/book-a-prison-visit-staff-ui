import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class BookerManagementPage extends AbstractPage {
  readonly emailInput: Locator

  readonly search: Locator

  constructor(page: Page) {
    super(page, 'Manage online bookers')

    this.emailInput = page.getByRole('textbox', { name: 'Enter the booker’s email' })
    this.search = page.getByRole('button', { name: 'Search' })
  }

  prisonerName = (index: number): Locator => this.page.getByTestId(`prisoner-name-${index}`)

  bookerEmail = (index: number): Locator => this.page.getByTestId(`booker-email-${index}`)

  visitorName = (index: number): Locator => this.page.getByTestId(`visitor-name-${index}`)

  requestedDate = (index: number): Locator => this.page.getByTestId(`requested-date-${index}`)

  viewRequestLink = (index: number, prisonerName: string): Locator =>
    this.page.getByTestId(`action-${index}`).getByRole('link', { name: `View visitor request for ${prisonerName}` })
}
