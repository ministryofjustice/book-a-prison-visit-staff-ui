import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import SearchForBookingByReferencePage from '../pages/searchForBookingByReference'
import SearchForBookingByReferenceResultsPage from '../pages/searchForBookingByReferenceResults'
import SearchForBookingByPrisonerPage from '../pages/searchForBookingByPrisoner'
import SearchForBookingByPrisonerResultsPage from '../pages/searchForBookingByPrisonerResults'
import VisitDetailsPage from '../pages/visitDetails'
import PrisonerProfilePage from '../pages/prisonerProfile'

context('Search for a booking by reference', () => {
  const prisoner = TestData.prisoner()
  const { prisonerNumber: offenderNo } = prisoner

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should search via booking reference then navigate to the summary page', () => {
    const homePage = Page.verifyOnPage(HomePage)
    const visit = TestData.visit()

    homePage.bookOrChangeVisitTile().click()

    const searchForBookingByPrisonerPage = Page.verifyOnPage(SearchForBookingByPrisonerPage)
    searchForBookingByPrisonerPage.searchByReferenceLink().click()

    const searchForBookingByReferencePage = Page.verifyOnPage(SearchForBookingByReferencePage)
    searchForBookingByReferencePage.enterVisitReference('ab-cd-ef-gh')

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisit', visit)
    searchForBookingByReferencePage.continueButton().click()

    const searchBookingByReferenceResultsPage = Page.verifyOnPage(SearchForBookingByReferenceResultsPage)

    searchBookingByReferenceResultsPage.visitReference().contains('ab-cd-ef-gh')
    searchBookingByReferenceResultsPage.prisonerName().contains('John Smith')
    searchBookingByReferenceResultsPage.prisonerNumber().contains(offenderNo)
    searchBookingByReferenceResultsPage.visitStatus().contains('Booked')

    cy.task('stubGetVisitDetailed', TestData.visitBookingDetailsDto())
    searchBookingByReferenceResultsPage.visitReferenceLink().click()

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.prisonerName().contains('John Smith')
  })

  it('should search via prisonerId then navigate to the summary page', () => {
    const homePage = Page.verifyOnPage(HomePage)
    homePage.bookOrChangeVisitTile().click()

    const searchForBookingByPrisonerPage = Page.verifyOnPage(SearchForBookingByPrisonerPage)
    searchForBookingByPrisonerPage.enterSearchTerm(offenderNo)
    cy.task('stubPrisoners', {
      term: offenderNo,
      results: {
        totalElements: 1,
        totalPages: 1,
        content: [prisoner],
      },
    })
    searchForBookingByPrisonerPage.continueButton().click()

    const searchBookingByPrisonerResultsPage = Page.verifyOnPage(SearchForBookingByPrisonerResultsPage)
    searchBookingByPrisonerResultsPage.resultRow().contains('Smith, John')
    searchBookingByPrisonerResultsPage.resultRow().contains(offenderNo)
    searchBookingByPrisonerResultsPage.resultRow().contains('2 April 1975')

    cy.task('stubPrisonerProfile', TestData.prisonerProfile({ visits: [TestData.visitSummary()] }))
    searchBookingByPrisonerResultsPage.prisonerLink().click()

    const prisonerProfilePage = Page.verifyOnPageTitle(PrisonerProfilePage, 'Smith, John')
    cy.task('stubGetVisitDetailed', TestData.visitBookingDetailsDto())
    prisonerProfilePage.visitTabReference().eq(0).click()

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.prisonerName().contains('John Smith')
  })
})
