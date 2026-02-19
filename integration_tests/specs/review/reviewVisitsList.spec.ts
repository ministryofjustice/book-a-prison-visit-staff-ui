import { test, expect } from '@playwright/test'
import { format } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import HomePage from '../../pages-playwright/homePage'
import VisitsReviewListingPage from '../../pages-playwright/review/visitsReviewListingsPage'
import { notificationTypes } from '../../../server/constants/notifications'
import { resetStubs, login } from '../../testUtils'
import orchestrationApi from '../../mockApis/orchestration'

test.describe('Bookings review listing page', () => {
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

  const notificationCount = visitNotifications.length

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({ notificationCount })
    await login(page)
  })

  test('should navigate to the bookings review listing page', async ({ page }) => {
    const homePage = await HomePage.verifyOnPage(page)

    // Need review tile + badge
    await expect(homePage.needReviewTile).toContainText('Visits that need review')
    await expect(homePage.needReviewBadgeCount).toContainText(String(notificationCount))

    // Stub listing data
    await orchestrationApi.stubGetVisitNotifications({
      prisonId: 'HEI',
      visitNotifications,
    })

    await homePage.needReviewTile.click()
    const listingPage = await VisitsReviewListingPage.verifyOnPage(page)

    // Visit #1
    await expect(listingPage.getPrisonerNumber(1)).toContainText(visitNotifications[0].prisonerNumber)
    await expect(listingPage.getVisitDate(1)).toContainText(
      format(new Date(visitNotifications[0].visitDate), prettyDateFormat),
    )
    await expect(listingPage.getBookedBy(1)).toContainText(visitNotifications[0].bookedByName)
    await expect(listingPage.getTypes(1)).toContainText(notificationTypes.VISITOR_RESTRICTION)
    await expect(listingPage.getActionLink(1)).toHaveAttribute(
      'href',
      `/visit/${visitNotifications[0].visitReference}?from=review`,
    )

    // Visit #2
    await expect(listingPage.getPrisonerNumber(2)).toContainText(visitNotifications[1].prisonerNumber)
    await expect(listingPage.getVisitDate(2)).toContainText(
      format(new Date(visitNotifications[1].visitDate), prettyDateFormat),
    )
    await expect(listingPage.getBookedBy(2)).toContainText(visitNotifications[1].bookedByName)
    await expect(listingPage.getTypes(2)).toContainText(notificationTypes.VISITOR_RESTRICTION)
    await expect(listingPage.getTypes(2)).toContainText(notificationTypes.PRISON_VISITS_BLOCKED_FOR_DATE)
    await expect(listingPage.getActionLink(2)).toHaveAttribute(
      'href',
      `/visit/${visitNotifications[1].visitReference}?from=review`,
    )
  })

  test('should filter bookings review listing', async ({ page }) => {
    const homePage = await HomePage.verifyOnPage(page)

    await orchestrationApi.stubGetVisitNotifications({
      prisonId: 'HEI',
      visitNotifications,
    })
    await homePage.needReviewTile.click()
    const listingPage = await VisitsReviewListingPage.verifyOnPage(page)

    // No filters
    await expect(listingPage.getBookingsRows()).toHaveCount(2)

    // Filter by user
    await listingPage.filterByUser('User One')
    await listingPage.applyFilter()
    await expect(listingPage.getBookingsRows()).toHaveCount(1)
    await listingPage.removeFilter('User One')

    // Filter by reason
    await listingPage.filterByReason('Time slot removed')
    await listingPage.applyFilter()
    await expect(listingPage.getBookingsRows()).toHaveCount(1)
    await listingPage.removeFilter('Time slot removed')

    // Filter by both
    await listingPage.filterByUser('User One')
    await listingPage.filterByReason('Time slot removed')
    await listingPage.applyFilter()
    await expect(listingPage.getBookingsRows()).toHaveCount(0)

    // Clear all
    await listingPage.clearFilters()
    await expect(listingPage.getBookingsRows()).toHaveCount(2)
  })
})
