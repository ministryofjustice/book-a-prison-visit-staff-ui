import { format, sub } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import SearchForABookingReferencePage from '../pages/searchForABookingReference'
import SearchForABookingPrisonerPage from '../pages/searchForABookingPrisoner'
import VisitDetailsPage from '../pages/visitDetails'

context('Search for a booking by reference', () => {
  const shortDateFormat = 'yyyy-MM-dd'
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

    searchForABookingReferencePage.enterVisitReference('gh-ef-cd-ab')

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisit', 'gh-ef-cd-ab')

    searchForABookingReferencePage.continueButton().click()

    searchForABookingReferencePage.resultRow().contains('gh-ef-cd-ab')
    searchForABookingReferencePage.resultRow().contains(prisonerDisplayName)
    searchForABookingReferencePage.resultRow().contains(offenderNo)
    searchForABookingReferencePage.resultRow().contains('Booked')

    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubAvailableSupport')

    searchForABookingReferencePage.visitReferenceLink().click()

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('gh-ef-cd-ab')
    visitDetailsPage.prisonerName().contains('Smith, John')
    visitDetailsPage.visitorName1().contains('Smith, Jeanette')
    visitDetailsPage.visitorName2().contains('Smith, Bob')
    visitDetailsPage.visitContact().contains('Smith, Bob')
    visitDetailsPage.additionalSupport().contains('custom support details')
    visitDetailsPage.bookedDateTime().contains('Monday 14 February 2022 at 10am')
  })

  it('Should search via prisonerId, than navigate to the summary page', () => {
    const homePage = Page.verifyOnPage(HomePage)
    // const today = new Date()
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'Smith, John'

    // const childDob = format(sub(today, { years: 5 }), shortDateFormat)
    // const contacts = [
    //   TestData.contact({ personId: 1234 }),
    //   TestData.contact({
    //     personId: 4322,
    //     firstName: 'Bob',
    //     dateOfBirth: childDob,
    //     relationshipCode: 'SON',
    //     relationshipDescription: 'Son',
    //   }),
    // ]

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
    cy.task('stubVisit', 'gh-ef-cd-ab')

    searchForABookingPrisonerPage.prisonerLink().click()
  })
})
