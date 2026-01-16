import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class ApprovedVisitorListPage extends AbstractPage {
  readonly linkVisitor: Locator

  constructor(page: Page) {
    super(page, 'Link a visitor')

    this.linkVisitor = page.getByRole('button', { name: 'Link the selected visitor' })
  }

  visitorName = (index: number): Locator => this.page.getByTestId(`visitor-${index}-name`)

  visitorDob = (index: number): Locator => this.page.getByTestId(`visitor-${index}-dob`)

  visitorLastVisitDate = (index: number): Locator => this.page.getByTestId(`visitor-${index}-last-visit`)

  selectVisitor = (name: string): Locator => this.page.getByRole('radio', { name: `Select ${name}` })
}
