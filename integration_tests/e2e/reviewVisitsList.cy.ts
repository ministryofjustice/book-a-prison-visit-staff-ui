import { format } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VisitsReviewListingPage from '../pages/visitsReviewListing'
import { notificationTypes } from '../../server/constants/notificationEvents'

context('Bookings review listing page', () => {
  const prettyDateFormat = 'd MMMM yyyy'

  const notificationGroups = [
    TestData.notificationGroup({
      reference: 'bc*de*fg*hi',
      type: 'PRISONER_RELEASED_EVENT',
      affectedVisits: [
        TestData.notificationVisitInfo({
          bookedByUserName: 'user3',
          bookedByName: 'User Three',
          prisonerNumber: 'B1234CD',
          visitDate: '2023-12-01',
        }),
      ],
    }),
    TestData.notificationGroup({
      reference: 'de*fg*hi*jk',
      type: 'PRISON_VISITS_BLOCKED_FOR_DATE',
      affectedVisits: [TestData.notificationVisitInfo()],
    }),
  ]
  const notificationCount = TestData.notificationCount({ count: notificationGroups.length })

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
    homePage.needReviewTile().contains('Need review')
    homePage.needReviewBadgeCount().contains(notificationCount.count)

    // booking review listing page
    cy.task('stubGetNotificationGroups', { notificationGroups })
    homePage.needReviewTile().click()
    const listingPage = Page.verifyOnPage(VisitsReviewListingPage)

    // Prisoner released
    listingPage.getPrisonerNumber(1).contains(notificationGroups[0].affectedVisits[0].prisonerNumber)
    listingPage
      .getVisitDate(1)
      .contains(format(new Date(notificationGroups[0].affectedVisits[0].visitDate), prettyDateFormat))
    listingPage.getBookedBy(1).contains(notificationGroups[0].affectedVisits[0].bookedByName)
    listingPage.getType(1).contains(notificationTypes[notificationGroups[0].type])
    listingPage
      .getActionLink(1)
      .should('have.attr', 'href', `/visit/${notificationGroups[0].affectedVisits[0].bookingReference}?from=review`)

    // Visits blocked for date
    listingPage.getPrisonerNumber(2).contains(notificationGroups[1].affectedVisits[0].prisonerNumber)
    listingPage
      .getVisitDate(2)
      .contains(format(new Date(notificationGroups[1].affectedVisits[0].visitDate), prettyDateFormat))
    listingPage.getBookedBy(2).contains(notificationGroups[1].affectedVisits[0].bookedByName)
    listingPage.getType(2).contains(notificationTypes[notificationGroups[1].type])
    listingPage
      .getActionLink(2)
      .should('have.attr', 'href', `/visit/${notificationGroups[1].affectedVisits[0].bookingReference}?from=review`)
  })

  it('should filter bookings review listing', () => {
    // Navigate to bookings review listing
    const homePage = Page.verifyOnPage(HomePage)
    cy.task('stubGetNotificationGroups', { notificationGroups })
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
    listingPage.filterByReason('Prisoner released')
    listingPage.applyFilter()
    listingPage.getBookingsRows().should('have.length', 1)
    listingPage.removeFilter('Prisoner released')

    // Filter by both
    listingPage.filterByUser('User One')
    listingPage.filterByReason('Prisoner released')
    listingPage.applyFilter()
    listingPage.getBookingsRows().should('have.length', 0)

    // Clear all filters
    listingPage.clearFilters()
    listingPage.getBookingsRows().should('have.length', 2)
  })
})
