import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../../abstractPage'

export default class VisitRequestRejectionReasonPage extends AbstractPage {
  readonly noAllowanceRadio: Locator

  readonly rejectButton: Locator

  constructor(page: Page) {
    super(page, 'Rejection reason (optional)')

    this.noAllowanceRadio = page.getByRole('radio', { name: 'The prisoner has used up their entitlement' })
    this.rejectButton = page.getByRole('button', { name: 'Confirm rejection' })
  }

  async selectNoVisitAllowanceReason(): Promise<void> {
    await this.noAllowanceRadio.check()
  }

  async confirmRejection(): Promise<void> {
    await this.rejectButton.click()
  }
}
