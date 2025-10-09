import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import bapvUserRoles from '../../server/constants/bapvUserRoles'

context('Home page', () => {
  const prisonStaffOnly = TestData.prisonDto({ clients: [{ userType: 'STAFF', active: true }] })
  const prisonStaffAndPublic = TestData.prisonDto({
    clients: [
      { userType: 'STAFF', active: true },
      { userType: 'PUBLIC', active: true },
    ],
  })

  const visitRequestCount = TestData.visitRequestCount()
  const notificationCount = TestData.notificationCount()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
  })

  it('should render the index page with the correct tiles - non-PUBLIC prison', () => {
    cy.task('stubGetPrison', prisonStaffOnly)
    cy.task('stubGetNotificationCount', { notificationCount })
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)

    homePage.bookOrChangeVisitTile().contains('Book or change a visit')
    homePage.visitRequestsTile().should('not.exist')
    homePage.needReviewTile().contains('Visits that need review')
    homePage.needReviewBadgeCount().contains(notificationCount.count)
    homePage.viewVisitsTile().contains('View visits by date')
    homePage.viewTimetableTile().contains('Visits timetable')
    homePage.blockDatesTile().contains('Block visit dates')
  })

  it('should render the index page with the booker management tile', () => {
    cy.task('stubGetPrison', prisonStaffOnly)
    cy.task('stubGetNotificationCount', { notificationCount })
    cy.task('stubSignIn', { userToken: { roles: [bapvUserRoles.STAFF_USER, bapvUserRoles.BOOKER_ADMIN] } })
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)

    homePage.bookerManagementTile().contains('Manage online bookers')
  })

  it('should render the index page without the booker management tile when role missing', () => {
    cy.task('stubGetPrison', prisonStaffOnly)
    cy.task('stubGetNotificationCount', { notificationCount })
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)

    homePage.bookerManagementTile().should('not.exist')
  })

  it('should render the index page with the correct tiles (inc visit requests) - PUBLIC prison', () => {
    cy.task('stubGetPrison', prisonStaffAndPublic)
    cy.task('stubGetVisitRequestCount', { visitRequestCount })
    cy.task('stubGetNotificationCount', { notificationCount })
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)

    homePage.bookOrChangeVisitTile().contains('Book or change a visit')
    homePage.visitRequestsTile().contains('Requested visits')
    homePage.visitRequestsBadgeCount().contains(visitRequestCount.count)
    homePage.needReviewTile().contains('Visits that need review')
    homePage.needReviewBadgeCount().contains(notificationCount.count)
    homePage.viewVisitsTile().contains('View visits by date')
    homePage.viewTimetableTile().contains('Visits timetable')
    homePage.blockDatesTile().contains('Block visit dates')
  })
})
