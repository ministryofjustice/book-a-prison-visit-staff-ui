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
      updatedBy: 'User Two',
      updatedDateAndTime: '2022-01-01T10:00:00',
      cancelledBy: 'User Three',
      cancelledDateAndTime: '2022-01-01T11:00:00',
      visit,
    })

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
    visitDetailsPage.visitDate().contains('14 January 2022')
    visitDetailsPage.visitTime().contains('10am to 11am')
    visitDetailsPage.visitType().contains('Open')
    visitDetailsPage.visitContact().contains('Smith, Jeanette')
    visitDetailsPage.visitPhone().contains('01234 567890')
    // Visitor Details
    visitDetailsPage.visitorName1().contains('Smith, Jeanette')
    visitDetailsPage.visitorDob1().contains('28 July 1986')
    visitDetailsPage.visitorRelationship1().contains('Wife')
    visitDetailsPage.visitorAddress1().contains('C1 2AB')
    visitDetailsPage.visitorRestrictions1().within(() => {
      cy.contains(contacts[0].restrictions[0].restrictionTypeDescription)
      cy.contains('End date not entered')
    })
    // Additional Information
    visitDetailsPage.visitComment().contains('Example of a visit comment')
    visitDetailsPage.visitorConcern().contains('Example of a visitor concern')
    visitDetailsPage.additionalSupport().contains('Wheelchair ramp, custom request')
    visitDetailsPage.visitBooked().contains('Saturday 1 January 2022 at 9am by User One')
    visitDetailsPage.visitUpdated().contains('Saturday 1 January 2022 at 10am by User Two')
  })

  it('Should show update/cancel button for future visit', () => {
    const today = new Date()
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'Smith, John'

    const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)
    const visitHistoryDetails = TestData.visitHistoryDetails({
      updatedBy: 'User Two',
      updatedDateAndTime: '2022-01-01T10:00:00',
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
    visitDetailsPage.visitDate().contains(format(new Date(futureVisitDate), longDateFormat))
    // Visitor Details - 1
    visitDetailsPage.visitorName1().contains('Smith, Jeanette')
    // Visitor Details - 2
    visitDetailsPage.visitorName2().contains('Smith, Bob')
    visitDetailsPage.visitorDob2().contains(format(new Date(childDob), longDateFormat))
    visitDetailsPage.visitorRelationship2().contains('Son')
    visitDetailsPage.visitorAddress2().contains('C1 2AB')
    visitDetailsPage.visitorRestrictions2().contains('None')
    // Additional Information
    visitDetailsPage.visitBooked().contains('Saturday 1 January 2022 at 9am by User One')
    visitDetailsPage.visitUpdated().contains('Saturday 1 January 2022 at 10am by User Two')
  })
})
