import { addDays, format, sub } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import SearchForBookingByReferencePage from '../pages/searchForBookingByReference'
import SearchForBookingByReferenceResultsPage from '../pages/searchForBookingByReferenceResults'
import SearchForBookingByPrisonerPage from '../pages/searchForBookingByPrisoner'
import SearchForBookingByPrisonerResultsPage from '../pages/searchForBookingByPrisonerResults'
import VisitDetailsPage from '../pages/visitDetails'
import UpcomingVisitsPage from '../pages/upcomingVisits'

context('Search for a booking by reference', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'd MMMM yyyy'
  const today = new Date()
  const prisoner = TestData.prisoner()
  const { prisonerNumber: offenderNo } = prisoner
  const prisonerDisplayName = 'Smith, John'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisonNames')
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

    homePage.changeAVisitTile().click()

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
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubAvailableSupport')
    cy.task('stubGetVisitNotifications', { reference: visit.reference })

    searchBookingByReferenceResultsPage.visitReferenceLink().click()

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.prisonerName().contains('Smith, John')
  })

  it('Should search via prisonerId, than navigate to the summary page', () => {
    const homePage = Page.verifyOnPage(HomePage)

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

    const searchForBookingByReferencePage = Page.verifyOnPage(SearchForBookingByReferencePage)

    searchForBookingByReferencePage.searchByPrisonerLink().click()

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

    cy.task('stubPrisoner', prisoner)
    cy.task('stubPrisonerById', prisoner)

    cy.task('stubFutureVisits', { prisonerId: prisoner.prisonerNumber, upcomingVisits: [upcomingVisit] })

    searchBookingByPrisonerResultsPage.prisonerLink().click()

    const upcomingVisitsPage = Page.verifyOnPage(UpcomingVisitsPage)

    upcomingVisitsPage.visitReference().contains('bc-de-fg-hi')
    upcomingVisitsPage.mainContact().contains('Smith, Jeanette')
    upcomingVisitsPage.visitDate().contains(format(new Date(upcomingVisit.startTimestamp), longDateFormat))
    upcomingVisitsPage.visitStatus().contains('Booked')

    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubAvailableSupport')
    cy.task('stubVisitHistory', TestData.visitHistoryDetails({ visit: upcomingVisit }))
    cy.task('stubGetVisitNotifications', { reference: upcomingVisit.reference })

    upcomingVisitsPage.visitReferenceLink().click()

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)

    visitDetailsPage.visitReference().contains('bc-de-fg-hi')
    visitDetailsPage.prisonerName().contains('Smith, John')
  })
})
