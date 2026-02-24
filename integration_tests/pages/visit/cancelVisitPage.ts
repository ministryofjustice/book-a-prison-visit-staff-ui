import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CancelVisitPage extends AbstractPage {
  readonly axeExcludedElements = [
    // Known issue with radio conditional reveal
    // See: https://github.com/alphagov/govuk-frontend/issues/979
    'input[aria-expanded]',
  ]

  readonly visitorCancelledRadio: Locator

  readonly establishmentCancelledRadio: Locator

  readonly prisonerCancelledRadio: Locator

  readonly administrativeErrorRadio: Locator

  readonly cancellationReasonInput: Locator

  readonly submitButton: Locator

  constructor(page: Page) {
    super(page, 'Why is this booking being cancelled?')

    // Cancellation reason radios
    this.visitorCancelledRadio = page.getByTestId('visitor_cancelled')
    this.establishmentCancelledRadio = page.getByTestId('establishment_cancelled')
    this.prisonerCancelledRadio = page.getByTestId('prisoner_cancelled')
    this.administrativeErrorRadio = page.getByTestId('administrative_error')

    // Text input
    this.cancellationReasonInput = page.locator('#reason')

    // Submit button
    this.submitButton = page.getByTestId('cancel-booking')
  }

  getRequestMethodByValue(value: string): Locator {
    return this.page.locator(`input[value="${value}"]`)
  }

  async enterCancellationReasonText(reason: string): Promise<void> {
    await this.cancellationReasonInput.fill(reason)
  }
}
