import { type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class HomePage extends AbstractPage {
  readonly bookOrChangeVisitTile: Locator

  readonly visitRequestsTile: Locator

  readonly visitRequestsBadgeCount: Locator

  readonly needReviewTile: Locator

  readonly needReviewBadgeCount: Locator

  readonly viewVisitsTile: Locator

  readonly viewTimetableTile: Locator

  readonly blockDatesTile: Locator

  readonly bookerManagementTile: Locator

  constructor(page: Page) {
    super(page, 'Manage prison visits')

    this.bookOrChangeVisitTile = page.getByTestId('book-or-change-visit')
    this.visitRequestsTile = page.getByTestId('visit-requests')
    this.visitRequestsBadgeCount = page.getByTestId('visit-request-count')
    this.needReviewTile = page.getByTestId('need-review')
    this.needReviewBadgeCount = page.getByTestId('need-review-count')
    this.viewVisitsTile = page.getByTestId('view-visits-by-date')
    this.viewTimetableTile = page.getByTestId('view-timetable')
    this.blockDatesTile = page.getByTestId('block-dates')
    this.bookerManagementTile = page.getByTestId('booker-management')
  }
}
