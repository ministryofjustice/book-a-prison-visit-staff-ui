import { expect, test } from '@playwright/test'
import orchestrationApi from '../../mockApis/orchestration'

import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'
import TestData from '../../../server/routes/testutils/testData'
import bapvUserRoles from '../../../server/constants/bapvUserRoles'
import BookerManagementPage from '../../pages/bookerManagement/bookerManagementPage'
import BookerDetailsPage from '../../pages/bookerManagement/booker/bookerDetailsPage'
import SelectBookerAccountPage from '../../pages/bookerManagement/selectBookerAccountPage'
import ApprovedVisitorListPage from '../../pages/bookerManagement/booker/approvedVisitorListPage'
import LinkVisitorPage from '../../pages/bookerManagement/booker/linkVisitorPage'

test.describe('Booker management - search, manual link/unlink visitors', () => {
  test.beforeEach(async () => {
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount()
    await orchestrationApi.stubGetVisitorRequests()
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test.describe('User does NOT have the booker admin role', () => {
    test('should deny access to a user without the required role', async ({ page }) => {
      await login(page)
      await page.goto('/manage-bookers')
      await expect(page.locator('h1')).toHaveText('Authorisation Error')
    })
  })

  test.describe('User has the booker admin role', () => {
    const email = 'booker@example.com'

    test.beforeEach(async ({ page }) => {
      await login(page, { roles: [bapvUserRoles.STAFF_USER, bapvUserRoles.BOOKER_ADMIN] })
    })

    test('should search for a booker and navigate to booker details page (single booker record)', async ({ page }) => {
      const bookerSearchResult = TestData.bookerSearchResult({ email })
      const bookerDetails = TestData.bookerDetailedInfo({ email })
      await orchestrationApi.stubGetBookersByEmail({ email, bookers: [bookerSearchResult] })
      await orchestrationApi.stubGetBookerDetails({ reference: bookerDetails.reference, booker: bookerDetails })

      // Home page - select booker management tile
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.bookerManagementTile.click()

      // Search for booker by email
      const bookerManagementPage = await BookerManagementPage.verifyOnPage(page)
      await bookerManagementPage.emailInput.fill(email)
      await bookerManagementPage.search.click()

      // Booker details page
      const bookerDetailsPage = await BookerDetailsPage.verifyOnPage(page)
      await expect(bookerDetailsPage.bookerEmail).toContainText(email)
      await expect(bookerDetailsPage.bookerReference).toContainText(bookerDetails.reference)
      await expect(bookerDetailsPage.prisonerHeading(1)).toContainText(
        'Visitors linked to John Smith (A1234BC) at Hewell (HMP)',
      )
      await expect(bookerDetailsPage.prisonerVisitorName(1, 1)).toContainText('Jeanette Smith')
    })

    test('should search for a booker and navigate to booker details page (multiple booker records)', async ({
      page,
    }) => {
      // most recently created is the 'active' booker record
      const activeBookerSearchResult = TestData.bookerSearchResult({ email, createdTimestamp: '2025-10-09T12:00:00' })
      const inactiveBookerSearchResult = TestData.bookerSearchResult({
        reference: 'xxxx-yyyy-zzzz',
        email,
        createdTimestamp: '2025-08-01T14:00:00',
      })
      const activeBookerDetails = TestData.bookerDetailedInfo({ email })

      await orchestrationApi.stubGetBookersByEmail({
        email,
        bookers: [inactiveBookerSearchResult, activeBookerSearchResult],
      })

      // Home page - select booker management tile
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.bookerManagementTile.click()

      // Search for booker by email
      const bookerManagementPage = await BookerManagementPage.verifyOnPage(page)
      await bookerManagementPage.emailInput.fill(email)
      await bookerManagementPage.search.click()

      await orchestrationApi.stubGetBookerDetails({
        reference: activeBookerDetails.reference,
        booker: activeBookerDetails,
      })

      // Select booker account page
      const selectBookerAccountPage = await SelectBookerAccountPage.verifyOnPage(page)
      await selectBookerAccountPage.continue.click()

      // Booker details page
      const bookerDetailsPage = await BookerDetailsPage.verifyOnPage(page)
      await expect(bookerDetailsPage.bookerEmail).toContainText(email)
      await expect(bookerDetailsPage.bookerReference).toContainText(activeBookerDetails.reference)
      await expect(bookerDetailsPage.prisonerHeading(1)).toContainText(
        'Visitors linked to John Smith (A1234BC) at Hewell (HMP)',
      )
      await expect(bookerDetailsPage.prisonerVisitorName(1, 1)).toContainText('Jeanette Smith')
    })

    test('should link a visitor to a booker account', async ({ page }) => {
      const bookerSearchResult = TestData.bookerSearchResult({ email })
      const bookerDetails = TestData.bookerDetailedInfo({ email })
      await orchestrationApi.stubGetBookersByEmail({ email, bookers: [bookerSearchResult] })
      await orchestrationApi.stubGetBookerDetails({ reference: bookerDetails.reference, booker: bookerDetails })

      // Home page - select booker management tile
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.bookerManagementTile.click()

      // Search for booker by email
      const bookerManagementPage = await BookerManagementPage.verifyOnPage(page)
      await bookerManagementPage.emailInput.fill(email)
      bookerManagementPage.search.click()

      // Booker details page
      const bookerDetailsPage = await BookerDetailsPage.verifyOnPage(page)
      await expect(bookerDetailsPage.bookerEmail).toContainText(email)
      await expect(bookerDetailsPage.bookerReference).toContainText(bookerDetails.reference)
      await expect(bookerDetailsPage.prisonerHeading(1)).toContainText(
        'Visitors linked to John Smith (A1234BC) at Hewell (HMP)',
      )
      await expect(bookerDetailsPage.prisonerVisitorName(1, 1)).toContainText('Jeanette Smith')

      const unlinkedContact = TestData.socialContact({
        firstName: 'Keith',
        lastName: 'Williams',
        visitorId: 1021,
        dateOfBirth: '1999-01-01',
      })
      // List unlinked contacts
      await orchestrationApi.stubGetNonLinkedSocialContacts({
        reference: bookerDetails.reference,
        prisonerId: bookerDetails.permittedPrisoners[0].prisoner.prisonerNumber,
        socialContacts: [unlinkedContact],
      })
      bookerDetailsPage.linkPrisonerVisitor(1).click()
      const approvedVisitorListPage = await ApprovedVisitorListPage.verifyOnPage(page)
      await expect(approvedVisitorListPage.visitorName(1)).toContainText('Keith Williams')
      await expect(approvedVisitorListPage.visitorDob(1)).toContainText('1 January 1999')
      await expect(approvedVisitorListPage.visitorLastVisitDate(1)).toContainText('11 October 2025')
      await approvedVisitorListPage.selectVisitor('Keith Williams').check()
      await approvedVisitorListPage.linkVisitor.click()

      // Link visitor page
      const linkVisitorPage = await LinkVisitorPage.verifyOnPage(page)
      await expect(linkVisitorPage.visitorName).toContainText('Keith Williams')
      await linkVisitorPage.doNotSendEmail.click()

      await orchestrationApi.stubLinkBookerVisitor({
        reference: bookerDetails.reference,
        prisonerId: bookerDetails.permittedPrisoners[0].prisoner.prisonerNumber,
        visitorId: unlinkedContact.visitorId,
        sendNotification: false,
      })
      await linkVisitorPage.submit.click()

      // booker details page
      await BookerDetailsPage.verifyOnPage(page)
      await expect(bookerDetailsPage.messages).toContainText('Keith Williams has been linked to this booker.')
    })

    test('should unlink a visitor from a booker account', async ({ page }) => {
      const bookerSearchResult = TestData.bookerSearchResult({ email })
      const bookerDetails = TestData.bookerDetailedInfo({ email })
      await orchestrationApi.stubGetBookersByEmail({ email, bookers: [bookerSearchResult] })
      await orchestrationApi.stubGetBookerDetails({ reference: bookerDetails.reference, booker: bookerDetails })

      // Home page - select booker management tile
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.bookerManagementTile.click()

      // Search for booker by email
      const bookerManagementPage = await BookerManagementPage.verifyOnPage(page)
      await bookerManagementPage.emailInput.fill(email)
      await bookerManagementPage.search.click()

      // Booker details page
      const bookerDetailsPage = await BookerDetailsPage.verifyOnPage(page)
      await expect(bookerDetailsPage.bookerEmail).toContainText(email)
      await expect(bookerDetailsPage.bookerReference).toContainText(bookerDetails.reference)
      await expect(bookerDetailsPage.prisonerHeading(1)).toContainText(
        'Visitors linked to John Smith (A1234BC) at Hewell (HMP)',
      )
      await expect(bookerDetailsPage.prisonerVisitorName(1, 1)).toContainText('Jeanette Smith')

      // Unlink visitor
      await orchestrationApi.stubUnlinkBookerVisitor({
        reference: bookerDetails.reference,
        prisonerId: bookerDetails.permittedPrisoners[0].prisoner.prisonerNumber,
        visitorId: bookerDetails.permittedPrisoners[0].permittedVisitors[0].visitorId,
      })
      await bookerDetailsPage.unlinkPrisonerVisitor(1, 1).click()
      await BookerDetailsPage.verifyOnPage(page)
      await expect(bookerDetailsPage.messages).toContainText('Jeanette Smith has been unlinked from this booker.')
    })
  })
})
