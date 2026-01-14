import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class CheckLinkedVisitorsPage extends AbstractPage {
  readonly header: Locator

  readonly bookerEmail: Locator

  readonly requestedVisitorName: Locator

  readonly visitorDob: Locator

  readonly prisonerName: Locator

  readonly rejectRequestRadio: Locator

  readonly confirm: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Check if the visitor is already linked' })
    this.bookerEmail = page.getByTestId('booker-email')
    this.requestedVisitorName = page.getByTestId('requested-visitor-name')
    this.visitorDob = page.getByTestId('requested-visitor-dob')
    this.prisonerName = page.getByTestId('prisoner-name')
    this.rejectRequestRadio = page.getByRole('radio', { name: 'No, reject the request' })
    this.confirm = page.getByTestId('reject-request')
  }

  static async verifyOnPage(page: Page): Promise<CheckLinkedVisitorsPage> {
    const checkLinkedVisitorsPage = new CheckLinkedVisitorsPage(page)
    await expect(checkLinkedVisitorsPage.header).toBeVisible()
    await checkLinkedVisitorsPage.verifyNoAccessViolationsOnPage()
    return checkLinkedVisitorsPage
  }

  visitorListVisitorName = (index: number): Locator => this.page.getByTestId(`visitor-${index}-name`)

  visitorListVisitorDob = (index: number): Locator => this.page.getByTestId(`visitor-${index}-dob`)
}
