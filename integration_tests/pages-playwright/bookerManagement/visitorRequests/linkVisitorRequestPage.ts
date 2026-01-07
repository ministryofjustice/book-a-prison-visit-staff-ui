import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class LinkVisitorRequestPage extends AbstractPage {
  readonly header: Locator

  readonly bookerEmail: Locator

  readonly requestedVisitorName: Locator

  readonly visitorDob: Locator

  readonly prisonerName: Locator

  readonly noMatchRadio: Locator

  readonly rejectRequestRadio: Locator

  readonly confirm: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Link a visitor' })
    this.bookerEmail = page.getByTestId('booker-email')
    this.requestedVisitorName = page.getByTestId('requested-visitor-name')
    this.visitorDob = page.getByTestId('requested-visitor-dob')
    this.prisonerName = page.getByTestId('prisoner-name')
    this.noMatchRadio = page.getByRole('radio', { name: 'None of the above' })
    this.rejectRequestRadio = page.getByRole('radio', { name: 'None of the above, reject the request' })
    this.confirm = page.getByTestId('link-visitor')
  }

  static async verifyOnPage(page: Page): Promise<LinkVisitorRequestPage> {
    const linkVisitorRequestPage = new LinkVisitorRequestPage(page)
    await expect(linkVisitorRequestPage.header).toBeVisible()
    return linkVisitorRequestPage
  }

  visitorListSelect = (index: number, visitorName: string): Locator =>
    this.page.getByTestId(`visitor-${index}-select`).getByRole('radio', { name: `Select ${visitorName}` })

  visitorListVisitorName = (index: number): Locator => this.page.getByTestId(`visitor-${index}-name`)

  visitorListVisitorDob = (index: number): Locator => this.page.getByTestId(`visitor-${index}-dob`)

  visitorListLastVisitDate = (index: number): Locator => this.page.getByTestId(`visitor-${index}-last-visit`)
}
