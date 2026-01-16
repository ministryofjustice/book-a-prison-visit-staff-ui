import { expect, type Locator, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

export default abstract class AbstractPage {
  readonly axeDisabledRules: string[]

  readonly axeExcludedElements: string[]

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

  protected constructor(page: Page, title: string) {
    this.page = page
    this.phaseBanner = page.getByTestId('header-phase-banner')
    this.usersName = page.locator('[data-qa=header-user-name]')
    this.signoutLink = page.getByText('Sign out')
    this.manageUserDetails = page.getByTestId('manageDetails')

    this.header = page.locator('h1', { hasText: title })

    this.messages = page.locator('.moj-alert')
  }

  static async verifyOnPage<PageClass extends new (...args: unknown[]) => AbstractPage>(
    this: PageClass,
    ...args: ConstructorParameters<PageClass>
  ): Promise<InstanceType<PageClass>> {
    const pageInstance = new this(...args) as InstanceType<PageClass>
    await expect(pageInstance.header).toBeVisible()
    await AbstractPage.verifyNoAccessibilityViolations(
      pageInstance.page,
      pageInstance.axeDisabledRules,
      pageInstance.axeExcludedElements,
    )

    return pageInstance
  }

  private static async verifyNoAccessibilityViolations(
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
