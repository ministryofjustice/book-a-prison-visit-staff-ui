import { format, add } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import VisitDetailsPage from '../pages/visitDetails'
import ClearNotificationsPage from '../pages/clearNotifications'
import eventAuditTypes from '../../server/constants/eventAuditTypes'
import { notificationTypes, notificationTypeWarnings } from '../../server/constants/notificationEvents'

context('Review a visit', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const today = new Date()
  const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should dismiss notifications when a visit is marked as not needing to be updated or cancelled', () => {
    const visitDetails = TestData.visitBookingDetailsDto({
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
    cy.task('stubGetVisitDetailed', visitDetails)

    // Start on booking summary page and chose 'Do not change' button
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitNotification().eq(0).contains(notificationTypeWarnings.PRISONER_RECEIVED_EVENT)
    visitDetailsPage.eventDescription(0).contains(notificationTypes.PRISONER_RECEIVED_EVENT)
    visitDetailsPage.clearNotifications().click()

    // Clear notifications page - select Yes and give a reason
    cy.task('stubIgnoreNotifications', {
      ignoreVisitNotificationsDto: { reason: 'some reason', actionedBy: 'USER1' },
      visit,
    })
    const clearNotificationsPage = Page.verifyOnPage(ClearNotificationsPage)
    clearNotificationsPage.selectYes()
    clearNotificationsPage.enterReason('some reason')

    // Submit and should be returned to booking summary with notification gone and timeline updated
    const visitDetailsUpdated = TestData.visitBookingDetailsDto({
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
    cy.task('stubGetVisitDetailed', visitDetailsUpdated)

    clearNotificationsPage.submit()
    visitDetailsPage.visitNotification().should('not.exist')
    visitDetailsPage.eventHeader(0).contains(eventAuditTypes.IGNORE_VISIT_NOTIFICATIONS_EVENT)
    visitDetailsPage.actionedBy(0).contains('User One')
    visitDetailsPage.eventTime(0).contains('Thursday 11 April 2024 at 11am')
    visitDetailsPage.eventDescription(0).contains('some reason')
  })
})
