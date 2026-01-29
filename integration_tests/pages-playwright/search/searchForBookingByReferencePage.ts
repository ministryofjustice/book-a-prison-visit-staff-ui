import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchForBookingByReferencePage extends AbstractPage {
  constructor(page: Page) {
    super(page, 'Search for a booking')
  }

  enterVisitReference = async (reference: string): Promise<void> => {
    const blocks = reference.split('-')

    await this.page.locator('#searchBlock1').fill(blocks[0])
    await this.page.locator('#searchBlock2').fill(blocks[1])
    await this.page.locator('#searchBlock3').fill(blocks[2])
    await this.page.locator('#searchBlock4').fill(blocks[3])
  }

  continueButton = (): Locator => this.page.locator('[data-test="search"]')

  searchByPrisonerLink = (): Locator => this.page.locator('[data-test="search-by-prisoner"]')
}
