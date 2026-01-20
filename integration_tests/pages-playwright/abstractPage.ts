import { expect, type Locator, type Page } from '@playwright/test'
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

  readonly header: Locator

  /** Axe rules to disable for a page */
  readonly axeDisabledRules: string[] = []

  /** Elements to exclude from Axe page scan */
  readonly axeExcludedElements: string[] = []

  protected constructor(page: Page, title: string) {
    this.page = page
    this.phaseBanner = page.getByTestId('header-phase-banner')
    this.usersName = page.locator('[data-qa=header-user-name]')
    this.signoutLink = page.getByText('Sign out')
    this.manageUserDetails = page.getByTestId('manageDetails')

    this.header = page.getByRole('heading', { level: 1, name: title })

    this.messages = page.locator('.moj-alert')
  }

  static async verifyOnPage<T extends AbstractPage, Args extends unknown[]>(
    this: (new (...args: Args) => T) & typeof AbstractPage,
    ...args: Args
  ): Promise<T> {
    const pageInstance = new this(...args)
    await expect(pageInstance.header).toBeVisible()

    // await this.verifyNoAccessibilityViolations(
    //   pageInstance.page,
    //   pageInstance.axeDisabledRules,
    //   pageInstance.axeExcludedElements,
    // )

    return pageInstance
  }

  protected static async verifyNoAccessibilityViolations(
    page: Page,
    disabledRules: string[] = [],
    exclude: string[] = [],
  ): Promise<void> {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(disabledRules)
      .exclude(exclude)
      .analyze()

    expect(accessibilityScanResults.violations).toHaveLength(0)
  }

  async signOut() {
    await this.signoutLink.first().click()
  }

  async clickManageUserDetails() {
    await this.manageUserDetails.first().click()
  }
}
