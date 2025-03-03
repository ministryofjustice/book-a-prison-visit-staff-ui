import { format, sub, add } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import VisitDetailsPage from '../pages/visitDetails'
import { NotificationType } from '../../server/data/orchestrationApiTypes'
import { notificationTypeWarnings } from '../../server/constants/notificationEvents'

context('Visit details page', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const dateFormatWithDay = 'EEEE d MMMM yyyy'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.task('stubGetVisitNotifications', { reference: TestData.visit().reference })
    cy.signIn()
  })

  it('should display all visit information for a past visit', () => {
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'John Smith'
    const visit = TestData.visit({
      visitStatus: 'CANCELLED',
      outcomeStatus: 'VISITOR_CANCELLED',
    })
    visit.visitNotes.push({ type: 'VISIT_OUTCOMES', text: 'Illness' })
    const visitHistoryDetails = TestData.visitHistoryDetails({
      visit,
    })
    visitHistoryDetails.eventsAudit.push({
      type: 'CANCELLED_VISIT',
      applicationMethodType: 'PHONE',
      actionedByFullName: 'User Two',
      userType: 'STAFF',
      createTimestamp: '2022-01-01T15:30:00',
    })

    const contacts = [TestData.contact({ personId: 4321, restrictions: [TestData.restriction()] })]

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts, approvedVisitorsOnly: 'false' })
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.cancellationType().contains('This visit was cancelled by a visitor.')

    // visit Details
    visitDetailsPage.visitDate().contains('Friday 14 January 2022')
    visitDetailsPage.visitTime().contains('10am to 11am')
    visitDetailsPage.visitType().contains('Open')
    visitDetailsPage.visitContact().contains('Jeanette Smith')
    visitDetailsPage.visitPhone().contains('01234 567890')
    visitDetailsPage.visitEmail().contains('visitor@example.com')
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage
      .additionalSupport()
      .contains('Wheelchair ramp, Portable induction loop for people with hearing aids')

    // actions
    visitDetailsPage.updateBooking().should('have.length', 0)
    visitDetailsPage.cancelBooking().should('have.length', 0)
    visitDetailsPage.clearNotifications().should('have.length', 0)

    // prisoner Details
    visitDetailsPage.prisonerName().contains(prisonerDisplayName)
    visitDetailsPage.prisonerNumber().contains(prisoner.prisonerNumber)
    visitDetailsPage.prisonerLocation().contains('1-1-C-028, HMP Hewell')
    visitDetailsPage.prisonerDob().contains('2 April 1975')

    // visitor details
    visitDetailsPage.visitorName(1).contains('Jeanette Smith')
    visitDetailsPage.visitorRelation(1).contains('wife')
    visitDetailsPage.visitorRelation(1).contains('wife')
    visitDetailsPage.visitorRestriction(1, 1).contains('Non-Contact Visit')

    // booking history (timeline)
    visitDetailsPage.eventHeader(0).contains('Cancelled')
    visitDetailsPage.actionedBy(0).contains('User Two')
    visitDetailsPage.eventTime(0).contains('Saturday 1 January 2022 at 3:30pm')
    visitDetailsPage.eventDescription(0).contains('Reason: Illness')

    visitDetailsPage.eventHeader(1).contains('Needs review')
    visitDetailsPage.eventTime(1).contains('Saturday 1 January 2022 at 11am')
    visitDetailsPage.eventDescription(1).contains('Reason: Time slot removed')

    visitDetailsPage.eventHeader(2).contains('Updated')
    visitDetailsPage.actionedBy(2).contains('User Two')
    visitDetailsPage.eventTime(2).contains('Saturday 1 January 2022 at 10am')
    visitDetailsPage.eventDescription(2).contains('Method: Email request')

    visitDetailsPage.eventHeader(3).contains('Booked')
    visitDetailsPage.actionedBy(3).contains('User One')
    visitDetailsPage.eventTime(3).contains('Saturday 1 January 2022 at 9am')
    visitDetailsPage.eventDescription(3).contains('Method: Phone booking')
  })

  it('should show update and cancel buttons, and notifications for future visit (date blocked)', () => {
    const today = new Date()
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'John Smith'

    const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)
    const visitHistoryDetails = TestData.visitHistoryDetails({
      visit: TestData.visit({
        startTimestamp: `${futureVisitDate}T12:00:00`,
        endTimestamp: `${futureVisitDate}T14:00:00`,
      }),
    })

    const childDob = format(sub(today, { years: 5 }), shortDateFormat)
    const contacts = [
      TestData.contact({ personId: 4321 }),
      TestData.contact({
        personId: 4322,
        firstName: 'Bob',
        dateOfBirth: childDob,
        relationshipCode: 'SON',
        relationshipDescription: 'Son',
      }),
    ]

    const notifications: NotificationType[] = ['PRISON_VISITS_BLOCKED_FOR_DATE']

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts, approvedVisitorsOnly: 'false' })
    cy.task('stubGetVisitNotifications', { reference: TestData.visit().reference, notifications })
    cy.visit('/visit/ab-cd-ef-gh')

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.updateBooking().should('have.length', 1)
    visitDetailsPage.cancelBooking().should('have.length', 1)
    visitDetailsPage.clearNotifications().should('have.length', 0)

    // notifications
    visitDetailsPage.visitNotifications().eq(0).contains(notificationTypeWarnings.PRISON_VISITS_BLOCKED_FOR_DATE)

    // Prisoner Details
    visitDetailsPage.prisonerName().contains(prisonerDisplayName)
    // Visit Details
    visitDetailsPage.visitDate().contains(format(new Date(futureVisitDate), dateFormatWithDay))
  })

  it('should show cancel and do not change buttons, and notifications for future visit (prisoner transferred)', () => {
    const today = new Date()
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'John Smith'

    const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)
    const visitHistoryDetails = TestData.visitHistoryDetails({
      visit: TestData.visit({
        startTimestamp: `${futureVisitDate}T12:00:00`,
        endTimestamp: `${futureVisitDate}T14:00:00`,
      }),
    })

    const childDob = format(sub(today, { years: 5 }), shortDateFormat)
    const contacts = [
      TestData.contact({ personId: 4321 }),
      TestData.contact({
        personId: 4322,
        firstName: 'Bob',
        dateOfBirth: childDob,
        relationshipCode: 'SON',
        relationshipDescription: 'Son',
      }),
    ]

    const notifications: NotificationType[] = ['PRISONER_RECEIVED_EVENT']

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts, approvedVisitorsOnly: 'false' })
    cy.task('stubGetVisitNotifications', { reference: TestData.visit().reference, notifications })
    cy.visit('/visit/ab-cd-ef-gh')

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.updateBooking().should('have.length', 0)
    visitDetailsPage.cancelBooking().should('have.length', 1)
    visitDetailsPage.clearNotifications().should('have.length', 1)

    // notifications
    visitDetailsPage.visitNotifications().eq(0).contains(notificationTypeWarnings.PRISONER_RECEIVED_EVENT)

    // Prisoner Details
    visitDetailsPage.prisonerName().contains(prisonerDisplayName)
    // Visit Details
    visitDetailsPage.visitDate().contains(format(new Date(futureVisitDate), dateFormatWithDay))
  })
})
