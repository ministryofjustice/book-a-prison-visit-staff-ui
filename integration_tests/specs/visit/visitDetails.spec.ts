import { test, expect } from '@playwright/test'
import { format, add } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import VisitDetailsPage from '../../pages/visit/visitDetailsPage'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import { notificationTypeAlerts } from '../../../server/constants/notifications'

test.describe('Visit details page', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const dateFormatWithDay = 'EEEE d MMMM yyyy'

  test.beforeEach(async ({ page }) => {
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
    await login(page)
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should display all visit information for a past visit', async ({ page }) => {
    const visitDetails = TestData.visitBookingDetailsRaw({
      visitStatus: 'CANCELLED',
      visitSubStatus: 'CANCELLED',
      outcomeStatus: 'VISITOR_CANCELLED',
      visitNotes: [{ type: 'VISIT_OUTCOMES', text: 'Illness' }],
    })

    visitDetails.events.push({
      type: 'CANCELLED_VISIT',
      applicationMethodType: 'PHONE',
      actionedByFullName: 'User Two',
      userType: 'STAFF',
      createTimestamp: '2022-01-01T15:30:00',
    })

    await orchestrationApi.stubGetVisitDetailed(visitDetails)

    await page.goto('/visit/ab-cd-ef-gh')
    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'booking')

    await expect(visitDetailsPage.messages.nth(0)).toContainText('This visit was cancelled by a visitor.')

    // Visit details
    await expect(visitDetailsPage.visitDate).toContainText('Friday 14 January 2022')
    await expect(visitDetailsPage.visitTime).toContainText('10am to 11am')
    await expect(visitDetailsPage.visitType).toContainText('Open')
    await expect(visitDetailsPage.visitContact).toContainText('Jeanette Smith')
    await expect(visitDetailsPage.visitPhone).toContainText('01234 567890')
    await expect(visitDetailsPage.visitEmail).toContainText('visitor@example.com')
    await expect(visitDetailsPage.visitReference).toContainText('ab-cd-ef-gh')
    await expect(visitDetailsPage.additionalSupport).toContainText('Wheelchair ramp')

    // Actions
    await expect(visitDetailsPage.updateBooking).toHaveCount(0)
    await expect(visitDetailsPage.cancelBooking).toHaveCount(0)
    await expect(visitDetailsPage.clearNotifications).toHaveCount(0)

    // Prisoner details
    await expect(visitDetailsPage.prisonerName).toContainText('John Smith')
    await expect(visitDetailsPage.prisonerNumber).toContainText('A1234BC')
    await expect(visitDetailsPage.prisonerLocation).toContainText('1-1-C-028, Hewell (HMP)')
    await expect(visitDetailsPage.prisonerDob).toContainText('2 April 1975')
    await expect(visitDetailsPage.prisonerRestriction(1)).toContainText('Restricted')
    await expect(visitDetailsPage.prisonerAlert(1)).toContainText('Protective Isolation Unit')

    // Visitor details
    await expect(visitDetailsPage.visitorName(1)).toContainText('Jeanette Smith')
    await expect(visitDetailsPage.visitorRelation(1)).toContainText('wife')
    await expect(visitDetailsPage.visitorRestriction(1, 1)).toContainText('Closed')

    // Booking history
    await expect(visitDetailsPage.eventHeader(0)).toContainText('Cancelled')
    await expect(visitDetailsPage.actionedBy(0)).toContainText('User Two')
    await expect(visitDetailsPage.eventTime(0)).toContainText('Saturday 1 January 2022 at 3:30pm')
    await expect(visitDetailsPage.eventDescription(0)).toContainText('Reason: Illness')

    await expect(visitDetailsPage.eventHeader(1)).toContainText('Booked')
    await expect(visitDetailsPage.actionedBy(1)).toContainText('User One')
    await expect(visitDetailsPage.eventTime(1)).toContainText('Saturday 1 January 2022 at 9am')
    await expect(visitDetailsPage.eventDescription(1)).toContainText('Method: Phone booking')
  })

  test('should show update and cancel buttons, and notifications for future visit (date blocked)', async ({ page }) => {
    const futureVisitDate = format(add(new Date(), { months: 1 }), shortDateFormat)

    await orchestrationApi.stubGetVisitDetailed(
      TestData.visitBookingDetailsRaw({
        startTimestamp: `${futureVisitDate}T12:00:00`,
        endTimestamp: `${futureVisitDate}T14:00:00`,
        notifications: [{ type: 'PRISON_VISITS_BLOCKED_FOR_DATE', createdDateTime: '', additionalData: [] }],
      }),
    )

    await page.goto('/visit/ab-cd-ef-gh')
    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'booking')

    await expect(visitDetailsPage.updateBooking).toHaveCount(1)
    await expect(visitDetailsPage.cancelBooking).toHaveCount(1)
    await expect(visitDetailsPage.clearNotifications).toHaveCount(0)

    await expect(visitDetailsPage.messages.nth(0)).toContainText(
      notificationTypeAlerts.PRISON_VISITS_BLOCKED_FOR_DATE.title,
    )

    await expect(visitDetailsPage.visitDate).toContainText(format(new Date(futureVisitDate), dateFormatWithDay))
  })

  test('should show cancel and do not change buttons, and notifications for future visit (prisoner transferred)', async ({
    page,
  }) => {
    const futureVisitDate = format(add(new Date(), { months: 1 }), shortDateFormat)

    await orchestrationApi.stubGetVisitDetailed(
      TestData.visitBookingDetailsRaw({
        startTimestamp: `${futureVisitDate}T12:00:00`,
        endTimestamp: `${futureVisitDate}T14:00:00`,
        notifications: [{ type: 'PRISONER_RECEIVED_EVENT', createdDateTime: '', additionalData: [] }],
      }),
    )

    await page.goto('/visit/ab-cd-ef-gh')
    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'booking')

    await expect(visitDetailsPage.updateBooking).toHaveCount(0)
    await expect(visitDetailsPage.cancelBooking).toHaveCount(1)
    await expect(visitDetailsPage.clearNotifications).toHaveCount(1)

    await expect(visitDetailsPage.messages.nth(0)).toContainText(notificationTypeAlerts.PRISONER_RECEIVED_EVENT.title)
  })

  test('should show alert and flag restrictions when visitor restrictions changed', async ({ page }) => {
    const futureVisitDate = format(add(new Date(), { months: 1 }), shortDateFormat)

    const visitDetails = TestData.visitBookingDetailsRaw({
      startTimestamp: `${futureVisitDate}T12:00:00`,
      endTimestamp: `${futureVisitDate}T14:00:00`,
      visitors: [
        TestData.contact({
          restrictions: [
            TestData.restriction({ restrictionId: 1, comment: 'Restriction 1' }),
            TestData.restriction({ restrictionId: 2, comment: 'Restriction 2' }),
            TestData.restriction({ restrictionId: 3, comment: 'Restriction 3' }),
          ],
        }),
      ],
      notifications: [
        {
          type: 'PERSON_RESTRICTION_UPSERTED_EVENT',
          createdDateTime: '',
          additionalData: [{ attributeName: 'VISITOR_RESTRICTION_ID', attributeValue: '1' }],
        },
        {
          type: 'VISITOR_RESTRICTION_UPSERTED_EVENT',
          createdDateTime: '',
          additionalData: [{ attributeName: 'VISITOR_RESTRICTION_ID', attributeValue: '3' }],
        },
      ],
    })

    await orchestrationApi.stubGetVisitDetailed(visitDetails)

    await page.goto('/visit/ab-cd-ef-gh')
    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'booking')

    const message = visitDetailsPage.messages.nth(0)
    await expect(message).toContainText('This visit needs review')

    await expect(message.locator('a').nth(0)).toHaveAttribute('href', '#visitor-restriction-1')
    await expect(message.locator('a').nth(1)).toHaveAttribute('href', '#visitor-restriction-3')

    await expect(page.locator('#visitor-restriction-1')).toContainText('This restriction has been added or updated')
    await expect(page.locator('#visitor-restriction-3')).toContainText('This restriction has been added or updated')

    await expect(page.locator('#visitor-restriction-2')).toHaveCount(0)
  })
})
