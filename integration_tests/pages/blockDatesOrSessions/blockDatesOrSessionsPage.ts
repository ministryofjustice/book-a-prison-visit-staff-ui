import { Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import DatePickerComponent from '../components-playwright/datePicker'

export default class BlockDatesOrSessionsPage extends AbstractPage {
  readonly datePicker: DatePickerComponent

  readonly continueButton: Locator

  readonly noBlockedDatesOrSessions: Locator

  constructor(page: Page) {
    super(page, 'Block visit dates or sessions')

    this.datePicker = new DatePickerComponent(page)

    this.continueButton = page.getByTestId('submit')
    this.noBlockedDatesOrSessions = page.getByTestId('no-blocked-dates-or-sessions')
  }

  blockedDate(index: number): Locator {
    return this.page.getByTestId(`blocked-date-${index}`)
  }

  blockedWhen(index: number): Locator {
    return this.page.getByTestId(`blocked-when-${index}`)
  }

  blockedAttendees(index: number): Locator {
    return this.page.getByTestId(`blocked-attendees-${index}`)
  }

  blockedBy(index: number): Locator {
    return this.page.getByTestId(`blocked-by-${index}`)
  }

  unblockLink(index: number): Locator {
    return this.page.getByTestId(`unblock-${index}`)
  }
}
