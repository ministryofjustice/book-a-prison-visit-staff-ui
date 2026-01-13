import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class PrisonerProfilePage extends AbstractPage {
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

    readonly visitingOrdersTab: Locator
    readonly activeAlertsTab: Locator
    readonly visitsTab: Locator

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

    readonly visitTabReference: Locator
    readonly visitTabType: Locator
    readonly visitTabLocation: Locator
    readonly visitTabDateAndTime: Locator
    readonly visitTabVisitors: Locator
    readonly visitTabVisitStatus: Locator
    readonly visitTabViewFullHistory: Locator

    readonly voOverrideButton: Locator
    readonly voOverrideText: Locator

    private constructor(page: Page) {
        super(page)

        this.flaggedAlerts = page.locator('.flagged-alert')
        this.prisonNumber = page.locator('[data-test="prison-number"]')
        this.dateOfBirth = page.locator('[data-test="dob"]')
        this.location = page.locator('[data-test="location"]')
        this.category = page.locator('[data-test="category"]')
        this.incentiveLevel = page.locator('[data-test="iep-level"]')
        this.convictionStatus = page.locator('[data-test="convicted-status"]')
        this.alertCount = page.locator('[data-test="active-alert-count"]')
        this.remainingVOs = page.locator('[data-test="remaining-vos"]')
        this.remainingPVOs = page.locator('[data-test="remaining-pvos"]')
        this.bookAVisitButton = page.locator('[data-test="book-a-visit"]')

        this.visitingOrdersTab = page.locator('#tab_visiting-orders')
        this.activeAlertsTab = page.locator('#tab_active-alerts')
        this.visitsTab = page.locator('#tab_visits')

        this.visitTabVORemaining = page.locator('[data-test="tab-vo-remaining"]')
        this.visitTabVOLastAdjustment = page.locator('[data-test="tab-vo-last-date"]')
        this.visitTabVONextAdjustment = page.locator('[data-test="tab-vo-next-date"]')
        this.visitTabPVORemaining = page.locator('[data-test="tab-pvo-remaining"]')
        this.visitTabPVOLastAdjustment = page.locator('[data-test="tab-pvo-last-date"]')
        this.visitTabPVONextAdjustment = page.locator('[data-test="tab-pvo-next-date"]')
        this.visitsTabShowVoHistoryLink = page.locator('[data-test="view-vo-history"]')

        this.alertsLink = page.locator('[data-test="all-alerts-link"]')
        this.alertsTabType = page.locator('[data-test="tab-alerts-type-desc"]')
        this.alertsTabCode = page.locator('[data-test="tab-alerts-code-desc"]')
        this.alertsTabComment = page.locator('[data-test="tab-alerts-comment"]')
        this.alertsTabStart = page.locator('[data-test="tab-alerts-start"]')
        this.alertsTabEnd = page.locator('[data-test="tab-alerts-end"]')

        this.visitTabReference = page.locator('[data-test="tab-visits-reference"] a')
        this.visitTabType = page.locator('[data-test="tab-visits-type"]')
        this.visitTabLocation = page.locator('[data-test="tab-visits-location"]')
        this.visitTabDateAndTime = page.locator('[data-test="tab-visits-date-and-time"]')
        this.visitTabVisitors = page.locator('[data-test="tab-visits-visitors"]')
        this.visitTabVisitStatus = page.locator('[data-test="tab-visits-status"]')
        this.visitTabViewFullHistory = page.locator('[data-test="view-dps-profile"]')

        this.voOverrideButton = page.locator('#vo-override')
        this.voOverrideText = page.locator('.moj-banner__message')
    }

    static async verifyOnPage(page: Page, prisonerName?: string): Promise<PrisonerProfilePage> {
        const profilePage = new PrisonerProfilePage(page)
        // Ensure basic elements are visible
        await expect(profilePage.prisonNumber).toBeVisible()
        await expect(profilePage.dateOfBirth).toBeVisible()
        await expect(profilePage.bookAVisitButton).toBeVisible()

        return profilePage
    }
}
