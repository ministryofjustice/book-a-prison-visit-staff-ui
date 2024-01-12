import { format } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VisitsReviewListingPage from '../pages/visitsReviewListing'
import { notificationTypes } from '../../server/constants/notificationEventTypes'

context('Bookings review page', () => {
  const prettyDateFormat = 'd MMMM yyyy'

  const notificationGroups = [
    TestData.notificationGroup(),
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
      reference: 'cd*ef*gh*ij',
      type: 'PRISONER_RESTRICTION_CHANGE_EVENT',
      affectedVisits: [
        TestData.notificationVisitInfo({
          bookedByUserName: 'user4',
          bookedByName: 'User Four',
          prisonerNumber: 'C1234DE',
          visitDate: '2023-12-05',
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
    cy.task('stubManageUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisonNames')
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

    // Non-association
    listingPage.getPrisonerNumber(1).contains(notificationGroups[0].affectedVisits[0].prisonerNumber)
    listingPage.getPrisonerNumber(1).contains(notificationGroups[0].affectedVisits[1].prisonerNumber)
    listingPage
      .getVisitDate(1)
      .contains(format(new Date(notificationGroups[0].affectedVisits[0].visitDate), prettyDateFormat))
    listingPage.getBookedBy(1).contains(notificationGroups[0].affectedVisits[0].bookedByName)
    listingPage.getBookedBy(1).contains(notificationGroups[0].affectedVisits[1].bookedByName)
    listingPage.getType(1).contains(notificationTypes[notificationGroups[0].type])
    listingPage
      .getActionLink(1)
      .should('have.attr', 'href', `/review/non-association/${notificationGroups[0].reference}`)

    // Prisoner released
    listingPage.getPrisonerNumber(2).contains(notificationGroups[1].affectedVisits[0].prisonerNumber)
    listingPage
      .getVisitDate(2)
      .contains(format(new Date(notificationGroups[1].affectedVisits[0].visitDate), prettyDateFormat))
    listingPage.getBookedBy(2).contains(notificationGroups[1].affectedVisits[0].bookedByName)
    listingPage.getType(2).contains(notificationTypes[notificationGroups[1].type])
    listingPage
      .getActionLink(2)
      .should('have.attr', 'href', `/visit/${notificationGroups[1].affectedVisits[0].bookingReference}`)

    // Visit type changed
    listingPage.getPrisonerNumber(3).contains(notificationGroups[2].affectedVisits[0].prisonerNumber)
    listingPage
      .getVisitDate(3)
      .contains(format(new Date(notificationGroups[2].affectedVisits[0].visitDate), prettyDateFormat))
    listingPage.getBookedBy(3).contains(notificationGroups[2].affectedVisits[0].bookedByName)
    listingPage.getType(3).contains(notificationTypes[notificationGroups[2].type])
    listingPage
      .getActionLink(3)
      .should('have.attr', 'href', `/visit/${notificationGroups[2].affectedVisits[0].bookingReference}`)

    // Visits blocked for date
    listingPage.getPrisonerNumber(4).contains(notificationGroups[3].affectedVisits[0].prisonerNumber)
    listingPage
      .getVisitDate(4)
      .contains(format(new Date(notificationGroups[3].affectedVisits[0].visitDate), prettyDateFormat))
    listingPage.getBookedBy(4).contains(notificationGroups[3].affectedVisits[0].bookedByName)
    listingPage.getType(4).contains(notificationTypes[notificationGroups[3].type])
    listingPage
      .getActionLink(4)
      .should('have.attr', 'href', `/visit/${notificationGroups[3].affectedVisits[0].bookingReference}`)
  })

  it('should filter bookings review listing', () => {
    // Navigate to bookings review listing
    const homePage = Page.verifyOnPage(HomePage)
    cy.task('stubGetNotificationGroups', { notificationGroups })
    homePage.needReviewTile().click()
    const listingPage = Page.verifyOnPage(VisitsReviewListingPage)

    // All rows show when no filter selected
    listingPage.getBookingsRows().should('have.length', 4)

    // Filter by user
    listingPage.filterByUser('User One')
    listingPage.applyFilter()
    listingPage.getBookingsRows().should('have.length', 2)
    listingPage.removeFilter('User One')

    // Filter by reason
    listingPage.filterByReason('Prisoner released')
    listingPage.applyFilter()
    listingPage.getBookingsRows().should('have.length', 1)
    listingPage.removeFilter('Prisoner released')

    // Filter by both
    listingPage.filterByUser('User One')
    listingPage.filterByReason('Visit type changed')
    listingPage.applyFilter()
    listingPage.getBookingsRows().should('have.length', 0)

    // Clear all filters
    listingPage.clearFilters()
    listingPage.getBookingsRows().should('have.length', 4)
  })
})
