import { test, expect } from '@playwright/test'
import TestData from '../../../server/routes/testutils/testData'
import HomePage from '../../pages/homePage'
import VisitRequestsListingPage from '../../pages/request/visitRequestsListingPage'
import VisitDetailsPage from '../../pages/visit/details/visitDetailsPage'
import orchestrationApi from '../../mockApis/orchestration'
import { resetStubs, login } from '../../testUtils'
import VisitRequestRejectionReasonPage from '../../pages/visit/visitRequests/visitRequestRejectionReasonPage'

test.describe('Process a visit Request', () => {
  const prisonStaffAndPublic = TestData.prisonDto({
    policyNoticeDaysMin: 0,
    clients: [
      { userType: 'STAFF', active: true, policyNoticeDaysMin: 3, policyNoticeDaysMax: 5 },
      { userType: 'PUBLIC', active: true, policyNoticeDaysMin: 3, policyNoticeDaysMax: 5 },
    ],
  })

  const visitRequest = TestData.visitRequestSummary()

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison(prisonStaffAndPublic)
    await orchestrationApi.stubGetVisitRequestCount({ visitRequestCount: 1 })
    await orchestrationApi.stubGetNotificationCount({ notificationCount: 0 })
    await login(page)
  })

  test('should navigate to a visit request via the requested visits listing page and approve', async ({ page }) => {
    const homePage = await HomePage.verifyOnPage(page)

    // Requested visits badge
    await expect(homePage.visitRequestsBadgeCount).toContainText('1')

    // Stub visit requests and navigate
    await orchestrationApi.stubGetVisitRequests({ visitRequests: [visitRequest] })
    await homePage.visitRequestsTile.click()

    const visitRequestsListingPage = await VisitRequestsListingPage.verifyOnPage(page)
    await expect(visitRequestsListingPage.getBeforeDaysMessage()).toContainText('before the visit date.')
    await expect(visitRequestsListingPage.getVisitDate(1)).toContainText('10/7/2025')
    await expect(visitRequestsListingPage.getVisitRequestedDate(1)).toContainText('1/7/2025')
    await expect(visitRequestsListingPage.getPrisonerName(1)).toContainText('John Smith')
    await expect(visitRequestsListingPage.getPrisonNumber(1)).toContainText('A1234BC')
    await expect(visitRequestsListingPage.getMainContact(1)).toContainText('Jeanette Smith')
    await expect(visitRequestsListingPage.getAction(1)).toHaveAttribute('href', '/visit/ab-cd-ef-gh?from=request')

    // View visit details
    const visitDetails = TestData.visitBookingDetailsRaw({
      visitSubStatus: 'REQUESTED',
      events: [
        {
          type: 'REQUESTED_VISIT',
          applicationMethodType: 'WEBSITE',
          actionedByFullName: null,
          userType: 'PUBLIC',
          createTimestamp: '2022-01-01T09:00:00',
        },
      ],
    })
    await orchestrationApi.stubGetVisitDetailed(visitDetails)
    await visitRequestsListingPage.getAction(1).click()

    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'Visit request details')
    await expect(visitDetailsPage.messages.first()).toContainText('This request needs to be reviewed')
    await expect(visitDetailsPage.visitDate).toContainText('Friday 14 January 2022')
    await expect(visitDetailsPage.visitReference).toContainText('ab-cd-ef-gh')
    await expect(visitDetailsPage.eventHeader(0)).toContainText('Requested')

    // Approve visit request
    await orchestrationApi.stubGetVisitRequests({ visitRequests: [] })
    const visitRequestResponse = TestData.visitRequestResponse()
    await orchestrationApi.stubApproveVisitRequest({
      reference: visitRequest.visitReference,
      visitRequestResponse,
    })
    await visitDetailsPage.approveRequest.click()

    // Returned to requested visits page
    await VisitRequestsListingPage.verifyOnPage(page)

    // Success message
    await expect(visitRequestsListingPage.messages.first()).toContainText(
      'You approved the request and booked the visit with John Smith',
    )
  })

  test('should navigate to a visit request via the requested visits listing page and reject', async ({ page }) => {
    const homePage = await HomePage.verifyOnPage(page)
    await expect(homePage.visitRequestsBadgeCount).toContainText('1')

    await orchestrationApi.stubGetVisitRequests({
      visitRequests: [visitRequest],
    })
    await homePage.visitRequestsTile.click()

    const visitRequestsListingPage = await VisitRequestsListingPage.verifyOnPage(page)

    const visitDetails = TestData.visitBookingDetailsRaw({
      visitSubStatus: 'REQUESTED',
      events: [
        {
          type: 'REQUESTED_VISIT',
          applicationMethodType: 'WEBSITE',
          actionedByFullName: null,
          userType: 'PUBLIC',
          createTimestamp: '2022-01-01T09:00:00',
        },
      ],
    })
    await orchestrationApi.stubGetVisitDetailed(visitDetails)

    await visitRequestsListingPage.getAction(1).click()
    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'Visit request details')
    await expect(visitDetailsPage.messages.first()).toContainText('This request needs to be reviewed')

    // Select 'Reject'
    await visitDetailsPage.rejectRequest.click()

    // Rejection reason page
    const visitRequestRejectionReasonPage = await VisitRequestRejectionReasonPage.verifyOnPage(page)
    await visitRequestRejectionReasonPage.selectSingleSession()

    // Confirm rejection
    await orchestrationApi.stubRejectVisitRequest({
      reference: visitRequest.visitReference,
      visitRequestRejectionReason: 'NO_VISIT_ALLOWANCE',
    })

    await orchestrationApi.stubGetVisitRequests({ visitRequests: [] })
    await visitRequestRejectionReasonPage.confirmRejection()

    // Returned to requested visits page
    await VisitRequestsListingPage.verifyOnPage(page)

    // Success message
    await expect(visitRequestsListingPage.messages.first()).toContainText(
      'You rejected the request to visit John Smith',
    )

    //  Assert that table is empty (no requests message)
    await expect(visitRequestsListingPage.getNoRequestsMessage()).toContainText('no visit requests')
  })
})
