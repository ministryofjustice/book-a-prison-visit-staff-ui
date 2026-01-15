import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectVisitorsPage extends AbstractPage {
  readonly continueButton: Locator

  readonly showFullCommentLink: Locator

  readonly closeFullCommentLink: Locator

  readonly header: Locator

  private constructor(page: Page, title: string) {
    super(page)

    this.continueButton = page.locator('[data-test=submit]')
    this.showFullCommentLink = page.locator('[data-test=show-full-comment]')
    this.closeFullCommentLink = page.locator('[data-test=close-full-comment]')
    this.header = page.locator('h1', { hasText: title })
  }

  static async verifyOnPage(page: Page, title: string): Promise<SelectVisitorsPage> {
    const selectVisitorsPage = new SelectVisitorsPage(page, title)
    await expect(selectVisitorsPage.continueButton).toBeVisible()
    return selectVisitorsPage
  }

  // Prisoner restrictions
  getPrisonerRestrictionType(index: number): Locator {
    return this.page.locator(`[data-test=restrictions-type${index}]`)
  }

  getPrisonerRestrictionComment(index: number): Locator {
    return this.page.locator(`[data-test=restrictions-comment${index}]`)
  }

  getPrisonerRestrictionEndDate(index: number): Locator {
    return this.page.locator(`[data-test=restrictions-end-date${index}]`)
  }

  // Prisoner alerts
  getPrisonerAlertType(index: number): Locator {
    return this.page.locator(`[data-test=alert-type${index}]`)
  }

  getPrisonerAlertComment(index: number): Locator {
    return this.page.locator(`[data-test=alert-comment${index}]`)
  }

  getPrisonerAlertEndDate(index: number): Locator {
    return this.page.locator(`[data-test=alert-end-date${index}]`)
  }

  // Visitor checkboxes and restrictions
  getVisitor(visitorId: number): Locator {
    return this.page.locator(`#visitor-${visitorId}`)
  }

  getVisitorRestrictions(visitorId: number): Locator {
    return this.page.locator(`[data-test="visitor-restrictions-${visitorId}"]`)
  }
}
