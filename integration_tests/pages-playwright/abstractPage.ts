import { type Locator, type Page, expect } from '@playwright/test'

export default class AbstractPage {
  readonly page: Page

  /** user name that appear in header */
  readonly usersName: Locator

  /** phase banner that appear in header */
  readonly phaseBanner: Locator

  /** link to sign out */
  readonly signoutLink: Locator

  /** link to manage user details */
  readonly manageUserDetails: Locator

  protected constructor(page: Page) {
    this.page = page
    this.phaseBanner = page.getByTestId('header-phase-banner')
    this.usersName = page.locator('[data-qa=header-user-name]')
    this.signoutLink = page.getByText('Sign out')
    this.manageUserDetails = page.getByTestId('manageDetails')
  }

  async signOut() {
    await this.signoutLink.first().click()
  }

  async clickManageUserDetails() {
    await this.manageUserDetails.first().click()
  }

  // Verify that the page heading matches expected text
  async verifyHeading(expectedHeading: string, level: 1 | 2 = 1): Promise<void> {
    const header = this.page.locator(`h${level}`, { hasText: expectedHeading })
    await expect(header).toBeVisible()
  }
}
