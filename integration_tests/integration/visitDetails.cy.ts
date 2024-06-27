import { format, sub, add } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import VisitDetailsPage from '../pages/visitDetails'
import { NotificationType } from '../../server/data/orchestrationApiTypes'
import { notificationTypeWarnings } from '../../server/constants/notificationEvents'

context('Visit details page', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'd MMMM yyyy'
  const dateFormatWithDay = 'EEEE d MMMM yyyy'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubFrontendComponents')
    cy.task('stubManageUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisonNames')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.task('stubGetVisitNotifications', { reference: TestData.visit().reference })
    cy.signIn()
  })

  it('Should display all visit information, past visit', () => {
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'Smith, John'
    const visit = TestData.visit({
      visitStatus: 'CANCELLED',
      outcomeStatus: 'VISITOR_CANCELLED',
    })
    visit.visitNotes.push({ type: 'VISIT_OUTCOMES', text: 'Illness' })
    const visitHistoryDetails = TestData.visitHistoryDetails({
      visit,
    })
    visitHistoryDetails.eventsAudit[2] = {
      type: 'UPDATED_VISIT',
      applicationMethodType: 'NOT_KNOWN',
      actionedByFullName: 'User Two',
      userType: 'STAFF',
      createTimestamp: '2022-01-01T10:00:00',
    }

    const contacts = [TestData.contact({ personId: 4321, restrictions: [TestData.restriction()] })]

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')

    visitDetailsPage.cancellationType().contains('This visit was cancelled by the visitor.')

    visitDetailsPage.updateBooking().should('have.length', 0)
    visitDetailsPage.cancelBooking().should('have.length', 0)
    visitDetailsPage.clearNotifications().should('have.length', 0)

    // Prisoner Details
    visitDetailsPage.prisonerName().contains(prisonerDisplayName)
    visitDetailsPage.prisonerNumber().contains(prisoner.prisonerNumber)
    visitDetailsPage.prisonerDob().contains('2 April 1975')
    visitDetailsPage.prisonerLocation().contains('1-1-C-028, HMP Hewell')
    // Visit Details
    visitDetailsPage.visitDateAndTime().contains('Friday 14 January 2022')
    visitDetailsPage.visitDateAndTime().contains('10am to 11am')
    visitDetailsPage.visitType().contains('Open')
    visitDetailsPage.visitContact().contains('Smith, Jeanette')
    visitDetailsPage.visitPhone().contains('01234 567890')
  })

  it('Should show update/cancel button and notifications for future visit', () => {
    const today = new Date()
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'Smith, John'

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

    const notifications: NotificationType[] = ['PRISONER_RELEASED_EVENT']

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubGetVisitNotifications', { reference: TestData.visit().reference, notifications })
    cy.visit('/visit/ab-cd-ef-gh')

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.updateBooking().should('have.length', 1)
    visitDetailsPage.cancelBooking().should('have.length', 1)
    visitDetailsPage.clearNotifications().should('have.length', 1)

    // notifications
    visitDetailsPage.visitNotification().eq(0).contains(notificationTypeWarnings.PRISONER_RELEASED_EVENT)

    // Prisoner Details
    visitDetailsPage.prisonerName().contains(prisonerDisplayName)
    // Visit Details
    visitDetailsPage.visitDateAndTime().contains(format(new Date(futureVisitDate), dateFormatWithDay))
  })

  it('Should show different tabs when sub navigation is used', () => {
    const today = new Date()
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'Smith, John'

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

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.visit('/visit/ab-cd-ef-gh')

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    // Prisoner Details
    visitDetailsPage.prisonerName().contains(prisonerDisplayName)
    // Visit Details
    visitDetailsPage.visitDateAndTime().contains(format(new Date(futureVisitDate), dateFormatWithDay))

    // Select prisoner tab
    visitDetailsPage.selectVisitorTab()
    // Visitor Details - 1
    visitDetailsPage.visitorName1().contains('Jeanette Smith (wife of the prisoner)')
    // Visitor Details - 2
    visitDetailsPage.visitorName2().contains('Bob Smith (son of the prisoner)')
    visitDetailsPage.visitorDob2().contains(format(new Date(childDob), longDateFormat))
    visitDetailsPage.visitorAddress2().contains('C1 2AB')
    visitDetailsPage.visitorRestrictions2().contains('None')
    visitDetailsPage
      .additionalSupport()
      .contains('Wheelchair ramp, Portable induction loop for people with hearing aids')

    // Select history tab
    visitDetailsPage.selectHistoryTab()
    visitDetailsPage.eventHeader(1).contains('Needs review')
    visitDetailsPage.eventTime(1).contains('Saturday 1 January 2022 at 11am')
    visitDetailsPage.needsReview(1).contains('Reason: Non-association')
    visitDetailsPage.actionedBy(2).contains('User Two')
    visitDetailsPage.eventHeader(2).contains('Updated')
    visitDetailsPage.eventTime(2).contains('Saturday 1 January 2022 at 10am')
    visitDetailsPage.requestMethod(2).contains('Request method: Email')
    visitDetailsPage.actionedBy(3).contains('User One')
    visitDetailsPage.eventHeader(3).contains('Booked')
    visitDetailsPage.eventTime(3).contains('Saturday 1 January 2022 at 9am')
    visitDetailsPage.requestMethod(3).contains('Request method: Phone call')
  })
})
