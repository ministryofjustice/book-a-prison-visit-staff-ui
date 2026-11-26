// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class RecordAttendanceListingPage extends AbstractPage {
  constructor(page: Page) {
    super(page, 'Record attendance')
  }
}
