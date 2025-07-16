import { format } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import HomePage from '../../pages/home'
import Page from '../../pages/page'
import VisitsReviewListingPage from '../../pages/review/visitsReviewListing'
import { notificationTypes } from '../../../server/constants/notifications'

context('Bookings review listing page', () => {
  const prettyDateFormat = 'd MMMM yyyy'

  const visitNotifications = [
    TestData.visitNotificationsRaw(),

    TestData.visitNotificationsRaw({
      visitReference: 'bc-de-fg-hi',
      prisonerNumber: 'B1234CD',
      bookedByUserName: 'user2',
      bookedByName: 'User Two',
      visitDate: '2025-07-02',
      notifications: [
        TestData.visitNotificationEventRaw({ type: 'PERSON_RESTRICTION_UPSERTED_EVENT' }),
        TestData.visitNotificationEventRaw({ type: 'PRISON_VISITS_BLOCKED_FOR_DATE' }),
      ],
    }),
  ]

  const notificationCount = TestData.notificationCount({ count: visitNotifications.length })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', { notificationCount })
    cy.signIn()
  })

  it('should navigate to the bookings review listing page', () => {
    const homePage = Page.verifyOnPage(HomePage)

    // 'Need review' tile and count
    homePage.needReviewTile().contains('Visits that need review')
    homePage.needReviewBadgeCount().contains(notificationCount.count)

    // booking review listing page
    cy.task('stubGetVisitNotifications', { visitNotifications })
    homePage.needReviewTile().click()
    const listingPage = Page.verifyOnPage(VisitsReviewListingPage)

    // Visit #1 - visitor restriction
    listingPage.getPrisonerNumber(1).contains(visitNotifications[0].prisonerNumber)
    listingPage.getVisitDate(1).contains(format(new Date(visitNotifications[0].visitDate), prettyDateFormat))
    listingPage.getBookedBy(1).contains(visitNotifications[0].bookedByName)
    listingPage.getTypes(1).contains(notificationTypes.VISITOR_RESTRICTION)
    listingPage
      .getActionLink(1)
      .should('have.attr', 'href', `/visit/${visitNotifications[0].visitReference}?from=review`)

    // Visit #2 - blocked date and visitor restriction
    listingPage.getPrisonerNumber(2).contains(visitNotifications[1].prisonerNumber)
    listingPage.getVisitDate(2).contains(format(new Date(visitNotifications[1].visitDate), prettyDateFormat))
    listingPage.getBookedBy(2).contains(visitNotifications[1].bookedByName)
    listingPage.getTypes(2).contains(notificationTypes.VISITOR_RESTRICTION)
    listingPage.getTypes(2).contains(notificationTypes.PRISON_VISITS_BLOCKED_FOR_DATE)
    listingPage
      .getActionLink(2)
      .should('have.attr', 'href', `/visit/${visitNotifications[1].visitReference}?from=review`)
  })

  it('should filter bookings review listing', () => {
    // Navigate to bookings review listing
    const homePage = Page.verifyOnPage(HomePage)
    cy.task('stubGetVisitNotifications', { visitNotifications })
    homePage.needReviewTile().click()
    const listingPage = Page.verifyOnPage(VisitsReviewListingPage)

    // All rows show when no filter selected
    listingPage.getBookingsRows().should('have.length', 2)

    // Filter by user
    listingPage.filterByUser('User One')
    listingPage.applyFilter()
    listingPage.getBookingsRows().should('have.length', 1)
    listingPage.removeFilter('User One')

    // Filter by reason
    listingPage.filterByReason('Time slot removed')
    listingPage.applyFilter()
    listingPage.getBookingsRows().should('have.length', 1)
    listingPage.removeFilter('Time slot removed')

    // Filter by both
    listingPage.filterByUser('User One')
    listingPage.filterByReason('Time slot removed')
    listingPage.applyFilter()
    listingPage.getBookingsRows().should('have.length', 0)

    // Clear all filters
    listingPage.clearFilters()
    listingPage.getBookingsRows().should('have.length', 2)
  })
})
