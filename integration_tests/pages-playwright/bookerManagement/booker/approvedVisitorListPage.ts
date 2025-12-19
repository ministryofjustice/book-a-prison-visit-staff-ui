import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class ApprovedVisitorListPage extends AbstractPage {
  readonly header: Locator

  readonly linkVisitor: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Link a visitor' })
    this.linkVisitor = page.getByRole('button', { name: 'Link the selected visitor' })
  }

  static async verifyOnPage(page: Page): Promise<ApprovedVisitorListPage> {
    const approvedVisitorListPage = new ApprovedVisitorListPage(page)
    await expect(approvedVisitorListPage.header).toBeVisible()
    return approvedVisitorListPage
  }

  visitorName = (index: number): Locator => this.page.getByTestId(`visitor-${index}-name`)

  visitorDob = (index: number): Locator => this.page.getByTestId(`visitor-${index}-dob`)

  visitorLastVisitDate = (index: number): Locator => this.page.getByTestId(`visitor-${index}-last-visit`)

  selectVisitor = (name: string): Locator => this.page.getByRole('radio', { name: `Select ${name}` })
}
