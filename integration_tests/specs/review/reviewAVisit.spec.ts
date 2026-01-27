import { test, expect } from '@playwright/test'
import { format, add } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import VisitDetailsPage from '../../pages-playwright/visit/visitDetailsPage'
import ClearNotificationsPage from '../../pages-playwright/visit/clearNotificationsPage'
import eventAuditTypes from '../../../server/constants/eventAudit'
import { notificationTypeAlerts, notificationTypes } from '../../../server/constants/notifications'
import auth from '../../mockApis/auth'
import orchestrationApi from '../../mockApis/orchestration'
import { resetStubs, login } from '../../testUtils'

test.describe('Review a visit', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const today = new Date()
  const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await auth.stubSignIn()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
    await login(page)
  })

  test('should dismiss notifications when a visit is marked as not needing to be updated or cancelled', async ({
    page,
  }) => {
    const visitDetails = TestData.visitBookingDetailsRaw({
      startTimestamp: `${futureVisitDate}T12:00:00`,
      endTimestamp: `${futureVisitDate}T14:00:00`,
      events: [
        {
          type: 'BOOKED_VISIT',
          applicationMethodType: 'PHONE',
          actionedByFullName: 'User One',
          userType: 'STAFF',
          createTimestamp: '2024-04-11T09:00:00',
        },
        {
          type: 'PRISONER_RECEIVED_EVENT',
          applicationMethodType: 'NOT_APPLICABLE',
          actionedByFullName: '',
          userType: 'SYSTEM',
          createTimestamp: '2024-04-11T10:00:00',
        },
      ],
      notifications: [{ type: 'PRISONER_RECEIVED_EVENT', createdDateTime: '', additionalData: [] }],
    })

    const visit = TestData.visit({
      startTimestamp: `${futureVisitDate}T12:00:00`,
      endTimestamp: `${futureVisitDate}T14:00:00`,
    })

    await orchestrationApi.stubGetVisitDetailed(visitDetails)

    // Visit booking summary page
    await page.goto('/visit/ab-cd-ef-gh')

    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'Visit booking details')

    await expect(visitDetailsPage.messages.first()).toContainText(notificationTypeAlerts.PRISONER_RECEIVED_EVENT.title)

    await expect(visitDetailsPage.eventDescription(0)).toContainText(notificationTypes.PRISONER_RECEIVED_EVENT)

    await visitDetailsPage.clearNotifications.click()

    // Stub ignore notifications
    await orchestrationApi.stubIgnoreNotifications({
      ignoreVisitNotificationsDto: { reason: 'some reason', actionedBy: 'USER1' },
      visit,
    })

    const clearNotificationsPage = await ClearNotificationsPage.verifyOnPage(page)

    await clearNotificationsPage.selectYes()
    await clearNotificationsPage.enterReason('some reason')

    const visitDetailsUpdated = TestData.visitBookingDetailsRaw({
      ...visitDetails,
      notifications: [],
      events: [
        ...visitDetails.events,
        {
          type: 'IGNORE_VISIT_NOTIFICATIONS_EVENT',
          applicationMethodType: 'NOT_APPLICABLE',
          text: 'some reason',
          actionedByFullName: 'User One',
          userType: 'STAFF',
          createTimestamp: '2024-04-11T11:00:00',
        },
      ],
    })

    await orchestrationApi.stubGetVisitDetailed(visitDetailsUpdated)

    await clearNotificationsPage.submit()

    await expect(visitDetailsPage.messages).toHaveCount(0)
    await expect(visitDetailsPage.eventHeader(0)).toContainText(eventAuditTypes.IGNORE_VISIT_NOTIFICATIONS_EVENT)
    await expect(visitDetailsPage.actionedBy(0)).toContainText('User One')
    await expect(visitDetailsPage.eventTime(0)).toContainText('Thursday 11 April 2024 at 11am')
    await expect(visitDetailsPage.eventDescription(0)).toContainText('some reason')
  })
})
