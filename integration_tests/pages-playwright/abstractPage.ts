import { type Locator, type Page, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

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

  /** top of page MoJ alert messages */
  readonly messages: Locator

  protected constructor(page: Page) {
    this.page = page
    this.phaseBanner = page.getByTestId('header-phase-banner')
    this.usersName = page.locator('[data-qa=header-user-name]')
    this.signoutLink = page.getByText('Sign out')
    this.manageUserDetails = page.getByTestId('manageDetails')

    this.messages = page.locator('.moj-alert')
  }

  async verifyNoAccessViolationsOnPage(disabledRules: string[] = []): Promise<void> {
    const accessibilityScanResults = await new AxeBuilder({ page: this.page }).disableRules(disabledRules).analyze()

    expect(accessibilityScanResults.violations).toHaveLength(0)
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
