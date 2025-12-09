import TestData from '../../../server/routes/testutils/testData'
import HomePage from '../../pages/home'
import Page from '../../pages/page'
import VisitRequestsListingPage from '../../pages/request/visitRequestsListing'
import VisitDetailsPage from '../../pages/visit/visitDetails'

context('Process a visit Request', () => {
  const prisonStaffAndPublic = TestData.prisonDto({
    policyNoticeDaysMin: 0,
    clients: [
      { userType: 'STAFF', active: true },
      { userType: 'PUBLIC', active: true },
    ],
  })

  const visitRequest = TestData.visitRequestSummary()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison', prisonStaffAndPublic)

    cy.task('stubGetVisitRequestCount', { visitRequestCount: 1 })
    cy.task('stubGetNotificationCount', { notificationCount: 0 })
    cy.signIn()
  })

  it('should navigate to a visit request via the requested visits listing page and approve', () => {
    // 'Requested visits' tile and count
    const homePage = Page.verifyOnPage(HomePage)
    homePage.visitRequestsBadgeCount().contains('1')

    // Go to requested visits page
    cy.task('stubGetVisitRequests', { visitRequests: [visitRequest] })
    homePage.visitRequestsTile().click()

    // Requested visits page
    const visitRequestsListingPage = Page.verifyOnPage(VisitRequestsListingPage)
    visitRequestsListingPage.getBeforeDaysMessage().contains('before the visit date.')
    visitRequestsListingPage.getVisitDate(1).contains('10/7/2025')
    visitRequestsListingPage.getVisitRequestedDate(1).contains('1/7/2025')
    visitRequestsListingPage.getPrisonerName(1).contains('John Smith')
    visitRequestsListingPage.getPrisonNumber(1).contains('A1234BC')
    visitRequestsListingPage.getMainContact(1).contains('Jeanette Smith')
    visitRequestsListingPage
      .getAction(1)
      .contains('View')
      .should('have.attr', 'href', '/visit/ab-cd-ef-gh?from=request')

    // View visit request
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
    cy.task('stubGetVisitDetailed', visitDetails)
    visitRequestsListingPage.getAction(1).click()
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage, { visitType: 'request' })
    visitDetailsPage.getMessages().eq(0).contains('This request needs to be reviewed')
    visitDetailsPage.visitDate().contains('Friday 14 January 2022')
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.eventHeader(0).contains('Requested')

    // Approve visit request
    cy.task('stubGetVisitRequests', { visitRequests: [] })
    const visitRequestResponse = TestData.visitRequestResponse()
    cy.task('stubApproveVisitRequest', {
      reference: visitRequest.visitReference,
      username: 'USER1',
      visitRequestResponse,
    })
    visitDetailsPage.approveRequest().click()

    // Returned to requested visits page, with success message and empty list
    visitRequestsListingPage.checkOnPage()
    visitRequestsListingPage
      .getMessages()
      .eq(0)
      .contains('You approved the request and booked the visit with John Smith')
    visitRequestsListingPage.getNoRequestsMessage().contains('no visit requests')
  })

  it('should navigate to a visit request via the requested visits listing page and reject', () => {
    // 'Requested visits' tile and count
    const homePage = Page.verifyOnPage(HomePage)
    homePage.visitRequestsBadgeCount().contains('1')

    // Go to requested visits page
    cy.task('stubGetVisitRequests', { visitRequests: [visitRequest] })
    homePage.visitRequestsTile().click()

    // Requested visits page
    const visitRequestsListingPage = Page.verifyOnPage(VisitRequestsListingPage)

    // View visit request
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
    cy.task('stubGetVisitDetailed', visitDetails)
    visitRequestsListingPage.getAction(1).click()
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage, { visitType: 'request' })
    visitDetailsPage.getMessages().eq(0).contains('This request needs to be reviewed')

    // Reject visit request
    cy.task('stubGetVisitRequests', { visitRequests: [] })
    const visitRequestResponse = TestData.visitRequestResponse()
    cy.task('stubRejectVisitRequest', {
      reference: visitRequest.visitReference,
      username: 'USER1',
      visitRequestResponse,
    })
    visitDetailsPage.rejectRequest().click()

    // Returned to requested visits page, with success message and empty list
    visitRequestsListingPage.checkOnPage()
    visitRequestsListingPage.getMessages().eq(0).contains('You rejected the request to visit John Smith')
    visitRequestsListingPage.getNoRequestsMessage().contains('no visit requests')
  })
})
