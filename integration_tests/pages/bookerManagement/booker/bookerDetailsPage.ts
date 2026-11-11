import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class BookerDetailsPage extends AbstractPage {
  readonly bookerEmail: Locator

  readonly bookerReference: Locator

  readonly linkVisitorButton: Locator

  constructor(page: Page) {
    super(page, 'Booker details')

    this.bookerEmail = page.getByTestId('booker-email')
    this.bookerReference = page.getByTestId('booker-reference')
    this.linkVisitorButton = page.getByTestId('link-visitor')
  }

  prisonerName = (prisonerIndex: number): Locator => this.page.getByTestId(`prisoner-${prisonerIndex}-prisoner-name`)

  prisonNumber = (prisonerIndex: number): Locator => this.page.getByTestId(`prisoner-${prisonerIndex}-prison-number`)

  prisonerVisitorName = (prisonerIndex: number, visitorIndex: number): Locator =>
    this.page.getByTestId(`prisoner-${prisonerIndex}-visitor-${visitorIndex}-contact-link`)

  prisonerVisitorDob = (prisonerIndex: number, visitorIndex: number): Locator =>
    this.page.getByTestId(`prisoner-${prisonerIndex}-visitor-${visitorIndex}-dob`)

  unlinkPrisonerVisitor = (prisonerIndex: number, visitorIndex: number): Locator =>
    this.page.getByTestId(`prisoner-${prisonerIndex}-visitor-${visitorIndex}-unlink`)

  // Visitor requests
  visitorName = (prisonerIndex: number, visitorIndex: number): Locator =>
    this.page.getByTestId(`prisoner-${prisonerIndex}-visitor-request-${visitorIndex}-name`)

  requestedDate = (prisonerIndex: number, visitorIndex: number): Locator =>
    this.page.getByTestId(`prisoner-${prisonerIndex}-visitor-request-${visitorIndex}-requested-date`)

  viewRequestLink = (prisonerIndex: number, visitorIndex: number, visitorName: string): Locator =>
    this.page
      .getByTestId(`prisoner-${prisonerIndex}-visitor-request-${visitorIndex}-action`)
      .getByRole('link', { name: `View request to add ${visitorName} as a visitor` })
}
