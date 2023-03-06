import { format, sub } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import VisitDetailsPage from '../pages/visitDetails'

context('Visit details page', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisons')
    cy.signIn()
  })

  it('Should display all visit information, future visit', () => {
    const today = new Date()
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'Smith, John'
    const visit = TestData.visit({ createdTimestamp: '2022-02-14T10:00:00' })

    const childDob = format(sub(today, { years: 5 }), shortDateFormat)
    const contacts = [
      TestData.contact({ personId: 1234 }),
      TestData.contact({
        personId: 4322,
        firstName: 'Bob',
        dateOfBirth: childDob,
        relationshipCode: 'SON',
        relationshipDescription: 'Son',
      }),
    ]

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisit', visit)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubAvailableSupport')
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')

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
    visitDetailsPage.visitorName1().contains('Smith, Bob')
    visitDetailsPage.visitorDob1().contains('6 March 2018')
    visitDetailsPage.visitorRelationship1().contains('Son')
    visitDetailsPage.visitorAddress1().contains('C1 2AB')
    visitDetailsPage.visitorRestrictions1().contains('None')
    // Additional Information
    visitDetailsPage.visitComment().contains('Example of a visit comment')
    visitDetailsPage.visitorConcern().contains('Example of a visitor concern')
    visitDetailsPage.additionalSupport().contains('Wheelchair ramp, custom request')
    visitDetailsPage.visitBooked().contains('Monday 14 February 2022 at 10am')
  })
})
