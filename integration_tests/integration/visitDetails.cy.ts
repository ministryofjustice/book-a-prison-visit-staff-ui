import { format, sub, add } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import VisitDetailsPage from '../pages/visitDetails'

context('Visit details page', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'd MMMM yyyy'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisons')
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
      actionedBy: 'User Two',
      createTimestamp: '2022-01-01T10:00:00',
    }

    const contacts = [TestData.contact({ personId: 4321, restrictions: [TestData.restriction()] })]

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubAvailableSupport')
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.cancellationReason().within(() => {
      cy.contains('This visit was cancelled by the visitor.')
      cy.contains('Reason: Illness')
    })
    visitDetailsPage.updateBooking().should('have.length', 0)
    visitDetailsPage.cancelBooking().should('have.length', 0)

    // Prisoner Details
    visitDetailsPage.prisonerName().contains(prisonerDisplayName)
    visitDetailsPage.prisonerNumber().contains(prisoner.prisonerNumber)
    visitDetailsPage.prisonerDob().contains('2 April 1975')
    visitDetailsPage.prisonerLocation().contains('1-1-C-028, HMP Hewell')
    // Visit Details
    visitDetailsPage.visitDateAndTime().contains('14 January 2022')
    visitDetailsPage.visitDateAndTime().contains('10am to 11am')
    visitDetailsPage.visitType().contains('Open')
    visitDetailsPage.visitContact().contains('Smith, Jeanette')
    visitDetailsPage.visitPhone().contains('01234 567890')
  })

  it('Should show update/cancel button for future visit', () => {
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
    cy.task('stubAvailableSupport')
    cy.visit('/visit/ab-cd-ef-gh')

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.updateBooking().should('have.length', 1)
    visitDetailsPage.cancelBooking().should('have.length', 1)
    // Prisoner Details
    visitDetailsPage.prisonerName().contains(prisonerDisplayName)
    // Visit Details
    visitDetailsPage.visitDateAndTime().contains(format(new Date(futureVisitDate), longDateFormat))
    // Visitor Details - 1
    // visitDetailsPage.visitorName1().contains('Smith, Jeanette')
    // Visitor Details - 2
    // visitDetailsPage.visitorName2().contains('Smith, Bob')
    // visitDetailsPage.visitorDob2().contains(format(new Date(childDob), longDateFormat))
    // visitDetailsPage.visitorRelationship2().contains('Son')
    // visitDetailsPage.visitorAddress2().contains('C1 2AB')
    // visitDetailsPage.visitorRestrictions2().contains('None')
    // Additional Information
    // visitDetailsPage.visitBooked().contains('Saturday 1 January 2022 at 9am by User One (phone call request)')
    // visitDetailsPage.visitUpdated().contains('Saturday 1 January 2022 at 10am by User Two (email request)')
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
    cy.task('stubAvailableSupport')
    cy.visit('/visit/ab-cd-ef-gh')

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    // Prisoner Details
    visitDetailsPage.prisonerName().contains(prisonerDisplayName)
    // Visit Details
    visitDetailsPage.visitDateAndTime().contains(format(new Date(futureVisitDate), longDateFormat))

    // Select prisoner tab
    visitDetailsPage.selectVisitorTab()
    // Visitor Details - 1
    visitDetailsPage.visitorName1().contains('Jeanette Smith (wife of the prisoner)')
    // Visitor Details - 2
    visitDetailsPage.visitorName2().contains('Bob Smith (son of the prisoner)')
    visitDetailsPage.visitorDob2().contains(format(new Date(childDob), longDateFormat))
    visitDetailsPage.visitorAddress2().contains('C1 2AB')
    visitDetailsPage.visitorRestrictions2().contains('None')
    visitDetailsPage.additionalSupport().contains('Wheelchair ramp, custom request')

    // Select history tab
    visitDetailsPage.selectHistoryTab()
    visitDetailsPage.firstActionedBy().contains('User One')
    visitDetailsPage.firstEventHeader().contains('Visit booked')
    visitDetailsPage.firstEventTime().contains('Saturday 1 January 2022 at 9am')
    visitDetailsPage.firstRequestMethod().contains('Phone call request')
    visitDetailsPage.secondActionedBy().contains('User Two')
    visitDetailsPage.secondEventHeader().contains('Visit updated')
    visitDetailsPage.secondEventTime().contains('Saturday 1 January 2022 at 10am')
    visitDetailsPage.secondRequestMethod().contains('Email request')
  })
})
