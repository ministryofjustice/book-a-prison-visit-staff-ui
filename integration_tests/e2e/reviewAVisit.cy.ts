import { format, add } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import VisitDetailsPage from '../pages/visitDetails'
import { NotificationType, VisitHistoryDetails } from '../../server/data/orchestrationApiTypes'
import ClearNotificationsPage from '../pages/clearNotifications'
import eventAuditTypes from '../../server/constants/eventAuditTypes'
import { notificationTypes, notificationTypeWarnings } from '../../server/constants/notificationEvents'

context('Review a visit', () => {
  const shortDateFormat = 'yyyy-MM-dd'

  const today = new Date()
  const prisoner = TestData.prisoner()
  const { prisonerNumber: offenderNo } = prisoner

  const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)
  const contacts = [TestData.contact({ personId: 4321 })]

  const eventsAudit: VisitHistoryDetails['eventsAudit'] = [
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
  ]

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should dismiss notifications when a visit is marked as not needing to be updated or cancelled', () => {
    const visitHistoryDetails = TestData.visitHistoryDetails({
      eventsAudit,
      visit: TestData.visit({
        startTimestamp: `${futureVisitDate}T12:00:00`,
        endTimestamp: `${futureVisitDate}T14:00:00`,
        createdTimestamp: '2022-02-14T10:00:00',
        visitors: [{ nomisPersonId: 4321 }],
      }),
    })
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts, approvedVisitorsOnly: false })

    const notifications: NotificationType[] = ['PRISONER_RECEIVED_EVENT']
    cy.task('stubGetVisitNotifications', { reference: visitHistoryDetails.visit.reference, notifications })

    // Start on booking summary page and chose 'Do not change' button
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitNotification().eq(0).contains(notificationTypeWarnings.PRISONER_RECEIVED_EVENT)
    visitDetailsPage.needsReview(1).contains(notificationTypes.PRISONER_RECEIVED_EVENT)
    visitDetailsPage.clearNotifications().click()

    // Clear notifications page - select Yes and give a reason
    cy.task('stubIgnoreNotifications', {
      ignoreVisitNotificationsDto: { reason: 'some reason', actionedBy: 'USER1' },
      visit: visitHistoryDetails.visit,
    })
    const clearNotificationsPage = Page.verifyOnPage(ClearNotificationsPage)
    clearNotificationsPage.selectYes()
    clearNotificationsPage.enterReason('some reason')

    // Submit and should be returned to booking summary with notification gone and timeline updated
    cy.task('stubGetVisitNotifications', { reference: visitHistoryDetails.visit.reference })
    cy.task('stubVisitHistory', {
      eventsAudit: [
        ...visitHistoryDetails.eventsAudit,
        {
          type: 'IGNORE_VISIT_NOTIFICATIONS_EVENT',
          applicationMethodType: 'NOT_APPLICABLE',
          text: 'some reason',
          actionedByFullName: 'User One',
          userType: 'STAFF',
          createTimestamp: '2024-04-11T11:00:00',
        },
      ],
      visit: visitHistoryDetails.visit,
    })
    clearNotificationsPage.submit()
    visitDetailsPage.visitNotification().should('not.exist')
    visitDetailsPage.selectHistoryTab()
    visitDetailsPage.eventHeader(1).contains(eventAuditTypes.IGNORE_VISIT_NOTIFICATIONS_EVENT)
    visitDetailsPage.actionedBy(1).contains('User One')
    visitDetailsPage.eventTime(1).contains('Thursday 11 April 2024 at 11am')
    visitDetailsPage.needsReview(1).contains('some reason')
  })

  it('should show prisoner transferred banner and needs review in history details', () => {
    eventsAudit[1].type = 'PRISONER_RECEIVED_EVENT'

    const visitHistoryDetails = TestData.visitHistoryDetails({
      eventsAudit,
      visit: TestData.visit({
        startTimestamp: `${futureVisitDate}T12:00:00`,
        endTimestamp: `${futureVisitDate}T14:00:00`,
        createdTimestamp: '2022-02-14T10:00:00',
        visitors: [{ nomisPersonId: 4321 }],
      }),
    })
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts, approvedVisitorsOnly: false })

    const notifications: NotificationType[] = ['PRISONER_RECEIVED_EVENT']
    cy.task('stubGetVisitNotifications', { reference: visitHistoryDetails.visit.reference, notifications })

    // Start on booking summary page and chose 'Do not change' button
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitNotification().eq(0).contains(notificationTypeWarnings.PRISONER_RECEIVED_EVENT)
    visitDetailsPage.needsReview(1).contains(notificationTypes.PRISONER_RECEIVED_EVENT)
  })

  it('should show prisoner released banner and needs review in history details', () => {
    eventsAudit[1].type = 'PRISONER_RELEASED_EVENT'

    const visitHistoryDetails = TestData.visitHistoryDetails({
      eventsAudit,
      visit: TestData.visit({
        startTimestamp: `${futureVisitDate}T12:00:00`,
        endTimestamp: `${futureVisitDate}T14:00:00`,
        createdTimestamp: '2022-02-14T10:00:00',
        visitors: [{ nomisPersonId: 4321 }],
      }),
    })
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts, approvedVisitorsOnly: false })

    const notifications: NotificationType[] = ['PRISONER_RELEASED_EVENT']
    cy.task('stubGetVisitNotifications', { reference: visitHistoryDetails.visit.reference, notifications })

    // Start on booking summary page and chose 'Do not change' button
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitNotification().eq(0).contains(notificationTypeWarnings.PRISONER_RELEASED_EVENT)
    visitDetailsPage.needsReview(1).contains(notificationTypes.PRISONER_RELEASED_EVENT)
  })
})
