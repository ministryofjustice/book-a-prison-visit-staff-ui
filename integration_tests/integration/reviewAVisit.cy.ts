import { format, add } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import VisitDetailsPage from '../pages/visitDetails'
import { NotificationType, VisitHistoryDetails } from '../../server/data/orchestrationApiTypes'
import ClearNotificationsPage from '../pages/clearNotifications'
import eventAuditTypes from '../../server/constants/eventAuditTypes'
import { notificationTypeWarnings } from '../../server/constants/notificationEvents'

context('Review a visit', () => {
  const shortDateFormat = 'yyyy-MM-dd'

  const today = new Date()
  const prisoner = TestData.prisoner()
  const { prisonerNumber: offenderNo } = prisoner

  const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)
  const eventsAudit: VisitHistoryDetails['eventsAudit'] = [
    {
      type: 'BOOKED_VISIT',
      applicationMethodType: 'PHONE',
      actionedBy: 'User One',
      createTimestamp: '2024-04-11T09:00:00',
    },
    {
      type: 'NON_ASSOCIATION_EVENT',
      applicationMethodType: 'NOT_APPLICABLE',
      createTimestamp: '2024-04-11T10:00:00',
    },
  ]
  const visitHistoryDetails = TestData.visitHistoryDetails({
    eventsAudit,
    visit: TestData.visit({
      startTimestamp: `${futureVisitDate}T12:00:00`,
      endTimestamp: `${futureVisitDate}T14:00:00`,
      createdTimestamp: '2022-02-14T10:00:00',
      visitors: [{ nomisPersonId: 4321 }],
    }),
  })
  const contacts = [TestData.contact({ personId: 4321 })]

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubFrontendComponents')
    cy.task('stubManageUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisonNames')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should dismiss notifications when a visit is marked as not needing to be updated or cancelled', () => {
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })

    const notifications: NotificationType[] = ['NON_ASSOCIATION_EVENT']
    cy.task('stubGetVisitNotifications', { reference: visitHistoryDetails.visit.reference, notifications })

    // Start on booking summary page and chose 'Do not change' button
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitNotification().eq(0).contains(notificationTypeWarnings.NON_ASSOCIATION_EVENT)
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
          actionedBy: 'User One',
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
})
