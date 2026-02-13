import { test, expect } from '@playwright/test'
import { format, add } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import VisitDetailsPage from '../../pages-playwright/visit/visitDetailsPage'
import CancelVisitPage from '../../pages-playwright/visit/cancelVisitPage'
import VisitCancelledPage from '../../pages-playwright/visit/visitCancelledPage'
import HomePage from '../../pages-playwright/homePage'
import { CancelVisitOrchestrationDto } from '../../../server/data/orchestrationApiTypes'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'

test.describe('Cancel visit journey', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'd MMMM yyyy'
  const today = new Date()
  const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)

  const visitDetails = TestData.visitBookingDetailsRaw({
    startTimestamp: `${futureVisitDate}T12:00:00`,
    endTimestamp: `${futureVisitDate}T14:00:00`,
  })

  const visit = TestData.visit({
    startTimestamp: `${futureVisitDate}T12:00:00`,
    endTimestamp: `${futureVisitDate}T14:00:00`,
    visitContact: {
      name: 'Jeanette Smith',
      telephone: '07771 123456',
      email: 'visitor@example.com',
    },
  })

  test.beforeEach(async ({ page }) => {
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
    await login(page)
    await orchestrationApi.stubGetVisitDetailed(visitDetails)
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should cancel a visit', async ({ page }) => {
    const cancelVisitDto: CancelVisitOrchestrationDto = {
      cancelOutcome: {
        outcomeStatus: 'ESTABLISHMENT_CANCELLED',
        text: 'Overbooking error',
      },
      applicationMethodType: 'NOT_APPLICABLE',
      actionedBy: 'USER1',
      userType: 'STAFF',
    }

    // --- Visit details page ---
    await page.goto(`/visit/${visit.reference}`)
    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'booking')

    await expect(visitDetailsPage.visitReference).toContainText(visit.reference)
    await visitDetailsPage.cancelBooking.click()

    // --- Cancel visit page ---
    const cancelVisitPage = await CancelVisitPage.verifyOnPage(page)
    await cancelVisitPage.establishmentCancelledRadio.click()
    await cancelVisitPage.enterCancellationReasonText(cancelVisitDto.cancelOutcome.text)

    await orchestrationApi.stubCancelVisit({ visit, cancelVisitDto })
    await cancelVisitPage.submitButton.click()

    // --- Visit cancelled page ---
    const visitCancelledPage = await VisitCancelledPage.verifyOnPage(page)
    await expect(visitCancelledPage.visitDetails).toContainText(format(new Date(futureVisitDate), longDateFormat))
    await expect(visitCancelledPage.contactMethodText).toContainText(
      'The main contact for this visit will get an email and a text message to confirm it has been cancelled.',
    )
    await visitCancelledPage.homeButton.click()

    await HomePage.verifyOnPage(page)
  })

  test('should cancel a visit with request method captured when VISITOR_CANCELLED', async ({ page }) => {
    const cancelVisitDto: CancelVisitOrchestrationDto = {
      cancelOutcome: {
        outcomeStatus: 'VISITOR_CANCELLED',
        text: 'Illness',
      },
      applicationMethodType: 'WEBSITE',
      actionedBy: 'USER1',
      userType: 'STAFF',
    }

    // --- Visit details page ---
    await page.goto(`/visit/${visit.reference}`)
    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'booking')
    await expect(visitDetailsPage.visitReference).toContainText(visit.reference)
    await visitDetailsPage.cancelBooking.click()

    // --- Cancel visit page ---
    const cancelVisitPage = await CancelVisitPage.verifyOnPage(page)
    await cancelVisitPage.visitorCancelledRadio.click()
    await cancelVisitPage.enterCancellationReasonText(cancelVisitDto.cancelOutcome.text)
    await cancelVisitPage.getRequestMethodByValue('WEBSITE').check()

    await orchestrationApi.stubCancelVisit({ visit, cancelVisitDto })
    await cancelVisitPage.submitButton.click()

    // --- Visit cancelled page ---
    const visitCancelledPage = await VisitCancelledPage.verifyOnPage(page)
    await expect(visitCancelledPage.visitDetails).toContainText(format(new Date(futureVisitDate), longDateFormat))
    await visitCancelledPage.homeButton.click()

    await HomePage.verifyOnPage(page)
  })
})
