import { addDays, format, sub } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import SearchForABookingReferencePage from '../pages/searchForABookingReference'
import SearchForABookingPrisonerPage from '../pages/searchForABookingPrisoner'
import VisitDetailsPage from '../pages/visitDetails'

context('Search for a booking by reference', () => {
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

  it('Should search via booking reference, than navigate to the summary page', () => {
    const homePage = Page.verifyOnPage(HomePage)
    const today = new Date()
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'Smith, John'
    const visit = TestData.visit()

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

    homePage.changeAVisitTile().click()

    const searchForABookingReferencePage = Page.verifyOnPage(SearchForABookingReferencePage)

    searchForABookingReferencePage.enterVisitReference('ab-cd-ef-gh')

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisit', visit)

    searchForABookingReferencePage.continueButton().click()

    searchForABookingReferencePage.visitReference().contains('ab-cd-ef-gh')
    searchForABookingReferencePage.prisonerName().contains(prisonerDisplayName)
    searchForABookingReferencePage.prisonerNumber().contains(offenderNo)
    searchForABookingReferencePage.visitStatus().contains('Booked')

    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubAvailableSupport')

    searchForABookingReferencePage.visitReferenceLink().click()

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.prisonerName().contains('Smith, John')
    visitDetailsPage.visitorName1().contains('Smith, Bob')
    visitDetailsPage.additionalSupport().contains('Wheelchair ramp, custom request')
  })

  it('Should search via prisonerId, than navigate to the summary page', () => {
    const homePage = Page.verifyOnPage(HomePage)
    const today = new Date()
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'Smith, John'

    const upcomingVisit = TestData.visit({
      reference: 'bc-de-fg-hi',
      startTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'13:30:00`),
      endTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'14:30:00`),
    })

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

    homePage.changeAVisitTile().click()

    const searchForABookingReferencePage = Page.verifyOnPage(SearchForABookingReferencePage)

    searchForABookingReferencePage.searchByPrisonerLink().click()

    const searchForABookingPrisonerPage = Page.verifyOnPage(SearchForABookingPrisonerPage)

    searchForABookingPrisonerPage.enterVisitReference(offenderNo)

    cy.task('stubPrisoners', {
      term: offenderNo,
      results: {
        totalElements: 1,
        totalPages: 1,
        content: [prisoner],
      },
    })

    searchForABookingPrisonerPage.continueButton().click()

    searchForABookingPrisonerPage.resultRow().contains(prisonerDisplayName)
    searchForABookingPrisonerPage.resultRow().contains(offenderNo)
    searchForABookingPrisonerPage.resultRow().contains('2 April 1975')

    cy.task('stubPrisoner', prisoner)
    cy.task('stubPrisonerById', prisoner)

    cy.task('stubUpcomingVisits', { offenderNo: prisoner.prisonerNumber, upcomingVisits: [upcomingVisit] })

    searchForABookingPrisonerPage.prisonerLink().click()

    searchForABookingPrisonerPage.visitReference().contains('bc-de-fg-hi')
    searchForABookingPrisonerPage.mainContact().contains('Smith, Jeanette')
    searchForABookingPrisonerPage.visitDate().contains(format(new Date(upcomingVisit.startTimestamp), longDateFormat))
    searchForABookingPrisonerPage.visitStatus().contains('Booked')

    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubAvailableSupport')
    cy.task('stubVisit', upcomingVisit)
    searchForABookingPrisonerPage.visitReferenceLink().click()

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('bc-de-fg-hi')
    visitDetailsPage.prisonerName().contains('Smith, John')
  })
})
