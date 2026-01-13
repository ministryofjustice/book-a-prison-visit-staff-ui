import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class PrisonerProfilePage extends AbstractPage {
  readonly header: Locator

  readonly flaggedAlerts: Locator

  readonly prisonNumber: Locator

  readonly dateOfBirth: Locator

  readonly location: Locator

  readonly category: Locator

  readonly incentiveLevel: Locator

  readonly convictionStatus: Locator

  readonly alertCount: Locator

  readonly remainingVOs: Locator

  readonly remainingPVOs: Locator

  readonly bookAVisitButton: Locator

  readonly visitsTab: Locator

  readonly activeAlertsTab: Locator

  readonly visitingOrdersTab: Locator

  readonly visitTabVORemaining: Locator

  readonly visitTabVOLastAdjustment: Locator

  readonly visitTabVONextAdjustment: Locator

  readonly visitTabPVORemaining: Locator

  readonly visitTabPVOLastAdjustment: Locator

  readonly visitTabPVONextAdjustment: Locator

  readonly visitsTabShowVoHistoryLink: Locator

  readonly alertsLink: Locator

  readonly alertsTabType: Locator

  readonly alertsTabCode: Locator

  readonly alertsTabComment: Locator

  readonly alertsTabStart: Locator

  readonly alertsTabEnd: Locator

  readonly visitTabType: Locator

  readonly visitTabLocation: Locator

  readonly visitTabDateAndTime: Locator

  readonly visitTabVisitors: Locator

  readonly visitTabVisitStatus: Locator

  readonly visitTabViewFullHistory: Locator

  readonly voOverrideButton: Locator

  readonly voOverrideText: Locator

  private constructor(page: Page, title: string) {
    super(page)
    this.header = page.locator('h1', { hasText: title })

    this.flaggedAlerts = page.locator('.flagged-alert')

    this.prisonNumber = page.getByTestId('prison-number')

    this.dateOfBirth = page.getByTestId('dob')

    this.location = page.getByTestId('location')

    this.category = page.getByTestId('category')

    this.incentiveLevel = page.getByTestId('iep-level')

    this.convictionStatus = page.getByTestId('convicted-status')

    this.alertCount = page.getByTestId('active-alert-count')

    this.remainingVOs = page.getByTestId('remaining-vos')

    this.remainingPVOs = page.getByTestId('remaining-pvos')

    this.bookAVisitButton = page.getByTestId('book-a-visit')

    this.visitsTab = page.getByRole('tab', { name: 'Visits' })

    this.activeAlertsTab = page.getByRole('tab', { name: 'Alerts' })

    this.visitingOrdersTab = page.getByRole('tab', { name: 'Visiting orders' })

    this.visitTabVORemaining = page.getByTestId('tab-vo-remaining')

    this.visitTabVOLastAdjustment = page.getByTestId('tab-vo-last-date')

    this.visitTabVONextAdjustment = page.getByTestId('tab-vo-next-date')

    this.visitTabPVORemaining = page.getByTestId('tab-pvo-remaining')

    this.visitTabPVOLastAdjustment = page.getByTestId('tab-pvo-last-date')

    this.visitTabPVONextAdjustment = page.getByTestId('tab-pvo-next-date')

    this.visitsTabShowVoHistoryLink = page.getByTestId('view-vo-history')

    this.alertsLink = page.getByTestId('all-alerts-link')

    this.alertsTabType = page.getByTestId('tab-alerts-type-desc')

    this.alertsTabCode = page.getByTestId('tab-alerts-code-desc')

    this.alertsTabComment = page.getByTestId('tab-alerts-comment')

    this.alertsTabStart = page.getByTestId('tab-alerts-start')

    this.alertsTabEnd = page.getByTestId('tab-alerts-end')

    this.visitTabType = page.getByTestId('tab-visits-type')

    this.visitTabLocation = page.getByTestId('tab-visits-location')

    this.visitTabDateAndTime = page.getByTestId('tab-visits-date-and-time')

    this.visitTabVisitors = page.getByTestId('tab-visits-visitors')

    this.visitTabVisitStatus = page.getByTestId('tab-visits-status')

    this.visitTabViewFullHistory = page.getByTestId('view-dps-profile')

    this.voOverrideButton = page.locator('#vo-override')

    this.voOverrideText = page.locator('.moj-banner__message')
  }

  static async verifyOnPage(page: Page, title: string): Promise<PrisonerProfilePage> {
    const homePage = new PrisonerProfilePage(page, title)
    await expect(homePage.header).toBeVisible()
    return homePage
  }

  visitTabCaption = (index: number): Locator => this.page.locator(`#visits caption:nth-of-type(${index})`)

  visitTabReference = (reference: string): Locator => this.page.getByRole('link', { name: reference })
}
