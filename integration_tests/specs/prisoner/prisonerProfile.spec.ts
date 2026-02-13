import { expect, test } from '@playwright/test'
import { format } from 'date-fns'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import TestData from '../../../server/routes/testutils/testData'
import PrisonerProfilePage from '../../pages-playwright/prisoner/prisonerProfilePage'

test.describe('Prisoner profile page', () => {
  const prettyDateFormat = 'd MMMM yyyy'

  test.beforeEach(async ({ page }) => {
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount()
    await orchestrationApi.stubGetVisitorRequests()

    await login(page)
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should show the prisoner profile page', async ({ page }) => {
    const prisonerDisplayName = 'Smith, John'

    const alerts = [
      TestData.alert({
        alertType: 'U',
        alertTypeDescription: 'COVID unit management',
        alertCode: 'UPIU',
        alertCodeDescription: 'Protective Isolation Unit',
        startDate: '2022-01-02',
      }),
      TestData.alert({
        alertType: 'X',
        alertTypeDescription: 'Security',
        alertCode: 'XR',
        alertCodeDescription: 'Racist',
        startDate: '2022-01-01',
      }),
    ]
    const visitors = [
      { nomisPersonId: 4321, firstName: 'Jeanette', lastName: 'Smith' },
      { nomisPersonId: 4322, firstName: 'Bob', lastName: 'Smith' },
    ]
    const visitSummary = TestData.visitSummary({ visitors })
    const profile = TestData.prisonerProfile({ alerts, visits: [visitSummary] })

    const { prisonerId } = profile

    // Prisoner profile page
    await orchestrationApi.stubPrisonerProfile(profile)

    // Go to prisoner profile page
    await page.goto(`/prisoner/${prisonerId}`)
    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page, prisonerDisplayName)

    // Prisoner details
    await expect(prisonerProfilePage.flaggedAlerts).toContainText('Protective Isolation Unit')
    await expect(prisonerProfilePage.prisonNumber).toContainText(profile.prisonerId)
    await expect(prisonerProfilePage.dateOfBirth).toContainText(format(new Date(profile.dateOfBirth), prettyDateFormat))
    await expect(prisonerProfilePage.location).toContainText(`${profile.cellLocation}, ${profile.prisonName}`)
    await expect(prisonerProfilePage.category).toContainText(profile.category)
    await expect(prisonerProfilePage.incentiveLevel).toContainText(profile.incentiveLevel)
    await expect(prisonerProfilePage.convictionStatus).toContainText(profile.convictedStatus)
    await expect(prisonerProfilePage.alertCount).toContainText('2')
    await expect(prisonerProfilePage.remainingVOs).toContainText('1')
    await expect(prisonerProfilePage.remainingPVOs).toContainText('2')

    // Visiting orders tab
    await prisonerProfilePage.visitingOrdersTab.click()
    await expect(prisonerProfilePage.visitingOrdersTabVORemaining).toContainText('1')
    await expect(prisonerProfilePage.visitingOrdersTabVOLastAdjustment).toContainText('21 April 2021')
    await expect(prisonerProfilePage.visitingOrdersTabVONextAdjustment).toContainText('5 May 2021')
    await expect(prisonerProfilePage.visitingOrdersTabPVORemaining).toContainText('2')
    await expect(prisonerProfilePage.visitingOrdersTabPVOLastAdjustment).toContainText('1 December 2021')
    await expect(prisonerProfilePage.visitingOrdersTabPVONextAdjustment).toContainText('1 January 2022')

    // Active alerts tab
    await prisonerProfilePage.activeAlertsTab.click()
    await expect(prisonerProfilePage.alertsLink).toHaveAttribute(
      'href',
      'https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/A1234BC/alerts/active',
    )
    await expect(prisonerProfilePage.alertsTabType.nth(0)).toContainText('COVID unit management (U)')
    await expect(prisonerProfilePage.alertsTabCode.nth(0)).toContainText('UPIU')
    await expect(prisonerProfilePage.alertsTabComment.nth(0)).toContainText('Alert comment')
    await expect(prisonerProfilePage.alertsTabStart.nth(0)).toContainText(
      format(new Date('01-02-2022'), prettyDateFormat),
    )
    await expect(prisonerProfilePage.alertsTabEnd.nth(0)).toContainText('Not entered')

    // Visits tab
    await prisonerProfilePage.visitsTab.click()
    await expect(prisonerProfilePage.visitTabCaption(1)).toContainText('January 2022 (1 past visit)')
    await expect(prisonerProfilePage.visitTabReference(profile.visits[0].reference)).toHaveAttribute(
      'href',
      `/visit/${profile.visits[0].reference}`,
    )
    await expect(prisonerProfilePage.visitTabType.nth(0)).toContainText('Social')
    await expect(prisonerProfilePage.visitTabLocation.nth(0)).toContainText('Hewell (HMP)')
    await expect(prisonerProfilePage.visitTabDateAndTime.nth(0)).toContainText(/(Friday 14 January 2022)(10am - 11am)/)
    await expect(prisonerProfilePage.visitTabVisitors.nth(0)).toContainText(/(Jeanette Smith)(Bob Smith)/)
    await expect(prisonerProfilePage.visitTabVisitStatus.nth(0)).toContainText('Booked')
    await expect(prisonerProfilePage.visitTabViewFullHistory).toHaveAttribute(
      'href',
      'https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/A1234BC/visits-details',
    )
  })
})
