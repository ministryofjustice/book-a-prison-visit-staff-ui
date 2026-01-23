import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectVisitTypePage extends AbstractPage {
  readonly continueButton: Locator

  constructor(page: Page) {
    super(page, "Check the prisoner's closed visit restrictions")
    this.continueButton = page.getByTestId('submit')
  }

  getPrisonerRestrictionType(index: number): Locator {
    return this.page.locator(`.prisoner-restrictions .test-restrictions-type${index}`)
  }

  selectOpenVisitType = async (): Promise<void> => {
    await this.page.getByLabel('Open visit').check()
  }

  selectClosedVisitType = async (): Promise<void> => {
    await this.page.getByLabel('Closed visit').check()
  }
}
