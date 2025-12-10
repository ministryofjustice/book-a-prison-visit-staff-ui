import bapvUserRoles from '../../../server/constants/bapvUserRoles'
import TestData from '../../../server/routes/testutils/testData'
import AuthorisationErrorPage from '../../pages/authorisationError'
import ApprovedVisitorListPage from '../../pages/bookerManagement/approvedVisitorList'
import BookerDetailsPage from '../../pages/bookerManagement/bookerDetails'
import BookerSearchPage from '../../pages/bookerManagement/bookerSearch'
import LinkVisitorPage from '../../pages/bookerManagement/linkVisitor'
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
      cy.task('stubGetVisitorRequests')
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

    it('should link a visitor to a booker account', () => {
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

      const unlinkedContact = TestData.socialContact({
        firstName: 'Keith',
        lastName: 'Williams',
        visitorId: 1021,
        dateOfBirth: '1999-01-01',
      })
      // List unlinked contacts
      cy.task('stubGetNonLinkedSocialContacts', {
        reference: bookerDetails.reference,
        prisonerId: bookerDetails.permittedPrisoners[0].prisoner.prisonerNumber,
        socialContacts: [unlinkedContact],
      })
      bookerDetailsPage.linkPrisonerVisitor(1)
      const approvedVisitorListPage = Page.verifyOnPage(ApprovedVisitorListPage)
      approvedVisitorListPage.getVisitorName(1).contains('Keith Williams')
      approvedVisitorListPage.getVisitorDob(1).contains('1 January 1999')
      approvedVisitorListPage.getVisitorLastVisitDate(1).contains('11 October 2025')
      approvedVisitorListPage.getVisitor(1021).click()
      approvedVisitorListPage.linkVisitor().click()

      // Link visitor page
      const linkVisitorPage = Page.verifyOnPage(LinkVisitorPage)
      linkVisitorPage.getVisitorName().contains('Keith Williams')
      linkVisitorPage.notifyBooker(2).click()

      cy.task('stubLinkBookerVisitor', {
        reference: bookerDetails.reference,
        prisonerId: bookerDetails.permittedPrisoners[0].prisoner.prisonerNumber,
        visitorId: unlinkedContact.visitorId,
        sendNotification: false,
      })
      linkVisitorPage.submit()

      // booker details page
      bookerDetailsPage.checkOnPage()
      bookerDetailsPage.getMessages().contains('Keith Williams has been linked to this booker.')
    })

    it('should unlink a visitor from a booker account', () => {
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

      // Unlink visitor
      cy.task('stubUnlinkBookerVisitor', {
        reference: bookerDetails.reference,
        prisonerId: bookerDetails.permittedPrisoners[0].prisoner.prisonerNumber,
        visitorId: bookerDetails.permittedPrisoners[0].permittedVisitors[0].visitorId,
      })
      bookerDetailsPage.unlinkPrisonerVisitor(1, 1)
      bookerDetailsPage.checkOnPage()
      bookerDetailsPage.getMessages().contains('Jeanette Smith has been unlinked from this booker.')
    })
  })
})
