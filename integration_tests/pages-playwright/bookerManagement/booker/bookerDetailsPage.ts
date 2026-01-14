import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class BookerDetailsPage extends AbstractPage {
  readonly header: Locator

  readonly bookerEmail: Locator

  readonly bookerReference: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Booker details' })
    this.bookerEmail = page.getByTestId('booker-email')
    this.bookerReference = page.getByTestId('booker-reference')
  }

  static async verifyOnPage(page: Page): Promise<BookerDetailsPage> {
    const bookerDetailsPage = new BookerDetailsPage(page)
    await expect(bookerDetailsPage.header).toBeVisible()
    await bookerDetailsPage.verifyNoAccessViolationsOnPage()
    return bookerDetailsPage
  }

  prisonerHeading = (index: number): Locator => this.page.getByTestId(`prisoner-${index}`)

  prisonerVisitorName = (prisonerIndex: number, visitorIndex: number): Locator =>
    this.page.getByTestId(`prisoner-${prisonerIndex}-visitor-${visitorIndex}-name`)

  linkPrisonerVisitor = (prisonerIndex: number): Locator =>
    this.page.getByTestId(`prisoner-${prisonerIndex}-link-visitor`)

  unlinkPrisonerVisitor = (prisonerIndex: number, visitorIndex: number): Locator =>
    this.page.getByTestId(`prisoner-${prisonerIndex}-visitor-${visitorIndex}-unlink`)
}
