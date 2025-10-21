import bapvUserRoles from '../../../server/constants/bapvUserRoles'
import TestData from '../../../server/routes/testutils/testData'
import AuthorisationErrorPage from '../../pages/authorisationError'
import BookerDetailsPage from '../../pages/bookerManagement/bookerDetails'
import BookerSearchPage from '../../pages/bookerManagement/bookerSearch'
import SelectBookerAccountPage from '../../pages/bookerManagement/selectBookerAccount'
import HomePage from '../../pages/home'
import Page from '../../pages/page'

context('Booker management', () => {
  describe('User does NOT have booker admin role', () => {
    it('should deny access to a user without the required role', () => {
      cy.task('reset')
      cy.task('stubSignIn')
      cy.task('stubSupportedPrisonIds')
      cy.task('stubGetPrison')
      cy.task('stubGetNotificationCount', {})
      cy.signIn({ failOnStatusCode: false })

      cy.visit('/manage-bookers/search', { failOnStatusCode: false })
      Page.verifyOnPage(AuthorisationErrorPage)
    })
  })

  describe('User has booker admin role', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { userToken: { roles: [bapvUserRoles.STAFF_USER, bapvUserRoles.BOOKER_ADMIN] } })
      cy.task('stubSupportedPrisonIds')
      cy.task('stubGetPrison')
      cy.task('stubGetNotificationCount', {})
      cy.signIn()
    })

    const email = 'booker@example.com'

    it('should search for a booker and navigate to booker details page (single booker record)', () => {
      const bookerSearchResult = TestData.bookerSearchResult({ email })
      const bookerDetails = TestData.bookerDetailedInfo({ email })
      cy.task('stubGetBookersByEmail', { email, bookers: [bookerSearchResult] })
      cy.task('stubGetBookerDetails', { reference: bookerDetails.reference, booker: bookerDetails })

      // Home page - select booker management tile
      const homePage = Page.verifyOnPage(HomePage)
      homePage.bookerManagementTile().click()

      // Search for booker by email
      const bookerSearchPage = Page.verifyOnPage(BookerSearchPage)
      bookerSearchPage.enterEmail(email)
      bookerSearchPage.search()

      // Booker details page
      const bookerDetailsPage = Page.verifyOnPage(BookerDetailsPage)
      bookerDetailsPage.getBookerEmail().contains(email)
      bookerDetailsPage.getBookerReference().contains(bookerDetails.reference)
      bookerDetailsPage.getPrisonerHeading(1).contains('Visits to John Smith (A1234BC) at Hewell (HMP)')
      bookerDetailsPage.getPrisonerVisitorName(1, 1).contains('Jeanette Smith')
    })

    it('should search for a booker and navigate to booker details page (multiple booker records)', () => {
      // most recently created is the 'active' booker record
      const activeBookerSearchResult = TestData.bookerSearchResult({ email, createdTimestamp: '2025-10-09T12:00:00' })
      const inactiveBookerSearchResult = TestData.bookerSearchResult({
        reference: 'xxxx-yyyy-zzzz',
        email,
        createdTimestamp: '2025-08-01T14:00:00',
      })
      const activeBookerDetails = TestData.bookerDetailedInfo({ email })

      cy.task('stubGetBookersByEmail', { email, bookers: [inactiveBookerSearchResult, activeBookerSearchResult] })

      // Home page - select booker management tile
      const homePage = Page.verifyOnPage(HomePage)
      homePage.bookerManagementTile().click()

      // Search for booker by email
      const bookerSearchPage = Page.verifyOnPage(BookerSearchPage)
      bookerSearchPage.enterEmail(email)
      bookerSearchPage.search()

      cy.task('stubGetBookerDetails', { reference: activeBookerDetails.reference, booker: activeBookerDetails })

      // Select booker account page
      const selectBookerAccountPage = Page.verifyOnPage(SelectBookerAccountPage)
      selectBookerAccountPage.continue()

      // Booker details page
      const bookerDetailsPage = Page.verifyOnPage(BookerDetailsPage)
      bookerDetailsPage.getMessages().contains('This account is active')
      bookerDetailsPage.getBookerEmail().contains(email)
      bookerDetailsPage.getBookerReference().contains(activeBookerDetails.reference)
      bookerDetailsPage.getPrisonerHeading(1).contains('Visits to John Smith (A1234BC) at Hewell (HMP)')
      bookerDetailsPage.getPrisonerVisitorName(1, 1).contains('Jeanette Smith')
    })
  })
})
