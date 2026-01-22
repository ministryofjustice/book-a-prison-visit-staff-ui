import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectVisitTypePage extends AbstractPage {
  constructor(page: Page) {
    super(page, "Check the prisoner's closed visit restrictions")
  }

  getPrisonerRestrictionType(index: number): Locator {
    return this.page.locator(`.prisoner-restrictions .test-restrictions-type${index}`)
  }

  selectOpenVisitType(): void {
    this.page.getByTestId('visit-type-open').check()
  }

  selectClosedVisitType(): void {
    this.page.getByTestId('visit-type-closed').check()
  }
}
