import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectVisitorsPage extends AbstractPage {
  static readonly title = 'Select visitor'

  readonly continueButton: Locator

  readonly showFullCommentLink: Locator

  readonly closeFullCommentLink: Locator

  constructor(page: Page) {
    super(page, SelectVisitorsPage.title)

    this.continueButton = page.locator('[data-test=submit]')
    this.showFullCommentLink = page.locator('[data-test=show-full-comment]')
    this.closeFullCommentLink = page.locator('[data-test=close-full-comment]')
  }

  // Prisoner restrictions
  getPrisonerRestrictionType(index: number): Locator {
    return this.page.getByTestId(`restrictions-type${index}`)
  }

  getPrisonerRestrictionComment(index: number): Locator {
    return this.page.getByTestId(`restrictions-comment${index}`)
  }

  getPrisonerRestrictionEndDate(index: number): Locator {
    return this.page.getByTestId(`restrictions-end-date${index}`)
  }

  // Prisoner alerts
  getPrisonerAlertType(index: number): Locator {
    return this.page.getByTestId(`alert-type${index}`)
  }

  getPrisonerAlertComment(index: number): Locator {
    return this.page.getByTestId(`alert-comment${index}`)
  }

  getPrisonerAlertEndDate(index: number): Locator {
    return this.page.getByTestId(`alert-end-date${index}`)
  }

  // Visitor checkboxes and restrictions
  getVisitor(visitorId: number): Locator {
    return this.page.locator(`#visitor-${visitorId}`)
  }

  getVisitorRestrictions(visitorId: number): Locator {
    return this.page.getByTestId(`visitor-restrictions-${visitorId}`)
  }
}
