import { format, sub } from 'date-fns'
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
  const shortDateFormat = 'yyyy-MM-dd'
  const today = new Date()
  const prisoner = TestData.prisoner()
  const { prisonerNumber: offenderNo } = prisoner
  const prisonerDisplayName = 'Smith, John'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('Should search via booking reference, than navigate to the summary page', () => {
    const homePage = Page.verifyOnPage(HomePage)
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
    searchBookingByReferenceResultsPage.prisonerName().contains(prisonerDisplayName)
    searchBookingByReferenceResultsPage.prisonerNumber().contains(offenderNo)
    searchBookingByReferenceResultsPage.visitStatus().contains('Booked')

    cy.task('stubVisitHistory', TestData.visitHistoryDetails({ visit }))
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts, approvedVisitorsOnly: 'false' })
    cy.task('stubGetVisitNotifications', { reference: visit.reference })

    searchBookingByReferenceResultsPage.visitReferenceLink().click()

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.prisonerName().contains('Smith, John')
  })

  it('Should search via prisonerId, than navigate to the summary page', () => {
    const homePage = Page.verifyOnPage(HomePage)
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

    searchBookingByPrisonerResultsPage.resultRow().contains(prisonerDisplayName)
    searchBookingByPrisonerResultsPage.resultRow().contains(offenderNo)
    searchBookingByPrisonerResultsPage.resultRow().contains('2 April 1975')

    cy.task('stubPrisonerById', prisoner)
    const alerts = []
    const visitors = [
      { nomisPersonId: 4321, firstName: 'Jeanette', lastName: 'Smith' },
      { nomisPersonId: 4322, firstName: 'Bob', lastName: 'Smith' },
    ]
    const visitSummary = TestData.visitSummary({ visitors })
    const profile = TestData.prisonerProfile({ alerts, visits: [visitSummary] })

    const { prisonerId } = profile
    const prisonId = 'HEI'

    cy.task('stubPrisonerProfile', { prisonId, prisonerId, profile })

    searchBookingByPrisonerResultsPage.prisonerLink().click()

    const prisonerProfilePage = Page.verifyOnPageTitle(PrisonerProfilePage, prisonerDisplayName)

    cy.task('stubVisitHistory', TestData.visitHistoryDetails({ visit }))
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts, approvedVisitorsOnly: 'false' })
    cy.task('stubGetVisitNotifications', { reference: visit.reference })

    prisonerProfilePage.visitTabReference().eq(0).click()

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.prisonerName().contains('Smith, John')
  })
})
