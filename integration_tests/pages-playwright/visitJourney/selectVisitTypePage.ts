import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectVisitTypePage extends AbstractPage {
  readonly submitButton: Locator

  constructor(page: Page, title: string) {
    super(page, title)
    this.submitButton = page.getByTestId('submit')
  }

  getPrisonerRestrictionType(index: number): Locator {
    return this.page.locator(`.prisoner-restrictions .test-restrictions-type${index}`)
  }

  selectOpenVisitType(): void {
    this.page.locator('[data-test="visit-type-open"]').check()
  }

  selectClosedVisitType(): void {
    this.page.locator('[data-test="visit-type-closed"]').check()
  }
}
