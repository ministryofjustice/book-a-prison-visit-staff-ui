import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ConfirmationPage extends AbstractPage {
  readonly bookingReference: Locator

  readonly prisonerName: Locator

  readonly prisonerNumber: Locator

  readonly visitDate: Locator

  readonly visitTime: Locator

  readonly visitType: Locator

  readonly additionalSupport: Locator

  readonly mainContactName: Locator

  readonly mainContactNumber: Locator

  readonly goToHomeLink: Locator

  readonly goToPrisonerLink: Locator

  readonly prisonName: Locator

  constructor(page: Page, title: 'Visit confirmed' | 'Visit updated' = 'Visit confirmed') {
    super(page, title)

    this.bookingReference = page.locator('.test-booking-reference')
    this.prisonerName = page.locator('.test-visit-prisoner-name')
    this.prisonerNumber = page.locator('.test-visit-prisoner-number')
    this.prisonName = page.locator('.test-visit-prison')
    this.visitDate = page.locator('.test-visit-date')
    this.visitTime = page.locator('.test-visit-time')
    this.visitType = page.locator('.test-visit-type')

    this.additionalSupport = page.locator('.test-additional-support')
    this.mainContactName = page.locator('.test-main-contact-name')
    this.mainContactNumber = page.locator('.test-main-contact-number')

    this.goToHomeLink = page.getByTestId('go-to-home')
    this.goToPrisonerLink = page.getByTestId('go-to-prisoner')
  }

  visitorName(index: number): Locator {
    return this.page.locator(`.test-visitor-name${index}`)
  }

  async viewPrisonersProfileButton(offenderNo: string): Promise<void> {
    await expect(this.goToPrisonerLink).toContainText('View this prisoner’s profile')
    await expect(this.goToPrisonerLink).toHaveAttribute('href', `/prisoner/${offenderNo}`)
  }
}
