import { expect, test } from '@playwright/test'
import { add, format } from 'date-fns'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'
import VisitsByDatePage from '../../pages/visitsByDate/visitsByDatePage'
import VisitPassesPage from '../../pages/visitPasses/visitPassesPage'
import TestData from '../../../server/routes/testutils/testData'
import VisitDetailsPage from '../../pages/visit/visitDetailsPage'

const shortDateFormat = 'yyyy-MM-dd'
const longDateFormat = 'EEEE d MMMM yyyy'
const today = new Date()
const todayShortFormat = format(today, shortDateFormat)
const todayLongFormat = format(today, longDateFormat)

const prisonId = 'HEI'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await orchestrationApi.stubSupportedPrisonIds()
  await orchestrationApi.stubGetPrison()
  await orchestrationApi.stubGetNotificationCount({})

  await login(page)
})

test.describe('Print visit passes by date (via visits by date page)', () => {
  const visitPassDto = TestData.visitPassDto({ visitDate: todayShortFormat })

  test('should navigate to print visit passes page and trigger print dialog', async ({ page }) => {
    await orchestrationApi.stubSessionSchedule({ prisonId, date: todayShortFormat, sessionSchedule: [] })
    await orchestrationApi.stubGetVisitsWithoutSessionTemplate({ prisonId, sessionDate: todayShortFormat, visits: [] })
    await orchestrationApi.stubIsBlockedDate({ prisonId, excludeDate: todayShortFormat, excludeDates: [] })
    await orchestrationApi.stubGetVisitPasses({ date: todayShortFormat, visitPassDtos: [visitPassDto] })

    // Navigate to Visits by date page
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.viewVisitsTile.click()
    const visitsByDatePage = await VisitsByDatePage.verifyOnPage(page)

    // Click 'Print visit passes' button
    await visitsByDatePage.printVisitPasses.click()
    const visitPassesPage = await VisitPassesPage.verifyOnPage(page, 'Print visit passes')

    // Visit passes page
    await expect(visitPassesPage.getPrisonName(1)).toContainText('Hewell (HMP)')
    await expect(visitPassesPage.getVisitDate(1)).toContainText(todayLongFormat)
    await expect(visitPassesPage.getVisitTime(1)).toContainText('10am to 11am')
    await expect(visitPassesPage.getPrisonerName(1)).toContainText('John Smith')
    await expect(visitPassesPage.getPrisonNumber(1)).toContainText(visitPassDto.prisonerId)
    await expect(visitPassesPage.getReference(1)).toContainText(visitPassDto.reference)
    await expect(visitPassesPage.getVisitType(1)).toContainText('Open')
    await expect(visitPassesPage.getVisitor(1, 1)).toContainText('Jeanette Smith')

    // Print button should trigger print dialog
    await visitPassesPage.printAllAndCheckForPrintDialog()
  })
})

test.describe('Print single visit pass by reference (via visit booking details page)', () => {
  test('should navigate to print visit passes page for a single visit and trigger print dialog', async ({ page }) => {
    const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)
    const visitDetails = TestData.visitBookingDetailsRaw({
      startTimestamp: `${futureVisitDate}T12:00:00`,
      endTimestamp: `${futureVisitDate}T14:00:00`,
    })
    const visitPassDto = TestData.visitPassDto({ visitDate: futureVisitDate })

    await orchestrationApi.stubGetVisitDetailed(visitDetails)
    await orchestrationApi.stubGetVisitPass({ reference: visitDetails.reference, visitPassDto })

    // Navigate to Visit booking details by date page
    await page.goto(`/visit/${visitDetails.reference}`)
    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'Visit booking details')

    // Click 'Print visit passes' button
    await visitDetailsPage.printVisitPass.click()
    const visitPassesPage = await VisitPassesPage.verifyOnPage(page, 'Print visit pass')

    // Visit passes page
    await expect(visitPassesPage.getReference(1)).toContainText(visitPassDto.reference)

    // Print button should trigger print dialog
    await visitPassesPage.printAllAndCheckForPrintDialog()
  })
})
