import { Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import DatePickerComponent from '../components-playwright/datePicker'

export default class BlockVisitDatesPage extends AbstractPage {
  readonly datePicker: DatePickerComponent

  readonly continueButton: Locator

  readonly noBlockedDates: Locator

  constructor(page: Page) {
    super(page, 'Block visit dates')

    this.datePicker = new DatePickerComponent(page)

    this.continueButton = page.getByTestId('submit')
    this.noBlockedDates = page.getByTestId('no-blocked-dates')
  }

  blockedDate(index: number): Locator {
    return this.page.getByTestId(`blocked-date-${index}`)
  }

  blockedBy(index: number): Locator {
    return this.page.getByTestId(`blocked-by-${index}`)
  }

  unblockLink(index: number): Locator {
    return this.page.getByTestId(`unblock-date-${index}`)
  }

  getMessages(): Locator {
    return this.page.locator('[data-test="messages"] li')
  }

  getSuccessMessage() {
    return this.page.locator('role=region[name^="success:"]')
  }
}
