import { format, add } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import Page from '../../pages/page'
import VisitDetailsPage from '../../pages/visit/visitDetails'
import { notificationTypeAlerts } from '../../../server/constants/notifications'

context('Visit details page', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const dateFormatWithDay = 'EEEE d MMMM yyyy'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should display all visit information for a past visit', () => {
    const visitDetails = TestData.visitBookingDetailsRaw({
      visitStatus: 'CANCELLED',
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
    cy.task('stubGetVisitDetailed', visitDetails)

    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage, { visitType: 'booking' })

    visitDetailsPage.getMessages().eq(0).contains('This visit was cancelled by a visitor.')

    // visit Details
    visitDetailsPage.visitDate().contains('Friday 14 January 2022')
    visitDetailsPage.visitTime().contains('10am to 11am')
    visitDetailsPage.visitType().contains('Open')
    visitDetailsPage.visitContact().contains('Jeanette Smith')
    visitDetailsPage.visitPhone().contains('01234 567890')
    visitDetailsPage.visitEmail().contains('visitor@example.com')
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.additionalSupport().contains('Wheelchair ramp')

    // actions
    visitDetailsPage.updateBooking().should('have.length', 0)
    visitDetailsPage.cancelBooking().should('have.length', 0)
    visitDetailsPage.clearNotifications().should('have.length', 0)

    // prisoner Details
    visitDetailsPage.prisonerName().contains('John Smith')
    visitDetailsPage.prisonerNumber().contains('A1234BC')
    visitDetailsPage.prisonerLocation().contains('1-1-C-028, Hewell (HMP)')
    visitDetailsPage.prisonerDob().contains('2 April 1975')
    visitDetailsPage.prisonerRestriction(1).contains('Restricted')
    visitDetailsPage.prisonerAlert(1).contains('Protective Isolation Unit')

    // visitor details
    visitDetailsPage.visitorName(1).contains('Jeanette Smith')
    visitDetailsPage.visitorRelation(1).contains('wife')
    visitDetailsPage.visitorRestriction(1, 1).contains('Closed')

    // booking history (timeline)
    visitDetailsPage.eventHeader(0).contains('Cancelled')
    visitDetailsPage.actionedBy(0).contains('User Two')
    visitDetailsPage.eventTime(0).contains('Saturday 1 January 2022 at 3:30pm')
    visitDetailsPage.eventDescription(0).contains('Reason: Illness')

    visitDetailsPage.eventHeader(1).contains('Booked')
    visitDetailsPage.actionedBy(1).contains('User One')
    visitDetailsPage.eventTime(1).contains('Saturday 1 January 2022 at 9am')
    visitDetailsPage.eventDescription(1).contains('Method: Phone booking')
  })

  it('should show update and cancel buttons, and notifications for future visit (date blocked)', () => {
    const today = new Date()
    const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)

    cy.task(
      'stubGetVisitDetailed',
      TestData.visitBookingDetailsRaw({
        startTimestamp: `${futureVisitDate}T12:00:00`,
        endTimestamp: `${futureVisitDate}T14:00:00`,
        notifications: [{ type: 'PRISON_VISITS_BLOCKED_FOR_DATE', createdDateTime: '', additionalData: [] }],
      }),
    )

    cy.visit('/visit/ab-cd-ef-gh')

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage, { visitType: 'booking' })
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.updateBooking().should('have.length', 1)
    visitDetailsPage.cancelBooking().should('have.length', 1)
    visitDetailsPage.clearNotifications().should('have.length', 0)

    // Messages
    visitDetailsPage.getMessages().eq(0).contains(notificationTypeAlerts.PRISON_VISITS_BLOCKED_FOR_DATE.title)

    // Prisoner Details
    visitDetailsPage.prisonerName().contains('John Smith')
    // Visit Details
    visitDetailsPage.visitDate().contains(format(new Date(futureVisitDate), dateFormatWithDay))
  })

  it('should show cancel and do not change buttons, and notifications for future visit (prisoner transferred)', () => {
    const today = new Date()
    const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)

    cy.task(
      'stubGetVisitDetailed',
      TestData.visitBookingDetailsRaw({
        startTimestamp: `${futureVisitDate}T12:00:00`,
        endTimestamp: `${futureVisitDate}T14:00:00`,
        notifications: [{ type: 'PRISONER_RECEIVED_EVENT', createdDateTime: '', additionalData: [] }],
      }),
    )

    cy.visit('/visit/ab-cd-ef-gh')

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage, { visitType: 'booking' })
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.updateBooking().should('have.length', 0)
    visitDetailsPage.cancelBooking().should('have.length', 1)
    visitDetailsPage.clearNotifications().should('have.length', 1)

    // Messages
    visitDetailsPage.getMessages().eq(0).contains(notificationTypeAlerts.PRISONER_RECEIVED_EVENT.title)

    // Prisoner Details
    visitDetailsPage.prisonerName().contains('John Smith')
    // Visit Details
    visitDetailsPage.visitDate().contains(format(new Date(futureVisitDate), dateFormatWithDay))
  })

  it('should show alert and flag restrictions when visitor restrictions changed', () => {
    const today = new Date()
    const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)

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

    cy.task('stubGetVisitDetailed', visitDetails)

    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage, { visitType: 'booking' })

    // Messages - alert component
    visitDetailsPage
      .getMessages()
      .eq(0)
      .within(() => {
        cy.contains('This visit needs review')
        cy.get('a')
          .eq(0)
          .should('have.attr', 'href', '#visitor-restriction-1')
          .contains('A restriction has been added or updated')
        cy.get('a')
          .eq(1)
          .should('have.attr', 'href', '#visitor-restriction-3')
          .contains('A restriction has been added or updated')
      })

    // Visitor restrictions
    cy.get('#visitor-restriction-1').contains('This restriction has been added or updated')
    visitDetailsPage.visitorRestriction(1, 1).parent().next().contains('Restriction 1')

    cy.get('#visitor-restriction-2').should('not.exist')
    visitDetailsPage.visitorRestriction(1, 2).parent().next().contains('Restriction 2')

    cy.get('#visitor-restriction-3').contains('This restriction has been added or updated')
    visitDetailsPage.visitorRestriction(1, 3).parent().next().contains('Restriction 3')
  })
})
