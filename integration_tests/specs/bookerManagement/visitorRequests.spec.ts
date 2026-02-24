import { expect, test } from '@playwright/test'
import orchestrationApi from '../../mockApis/orchestration'

import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'
import bapvUserRoles from '../../../server/constants/bapvUserRoles'
import BookerManagementPage from '../../pages/bookerManagement/bookerManagementPage'
import TestData from '../../../server/routes/testutils/testData'
import LinkVisitorRequestPage from '../../pages/bookerManagement/visitorRequests/linkVisitorRequestPage'
import CheckLinkedVisitorsPage from '../../pages/bookerManagement/visitorRequests/checkLinkedVisitorsPage'

test.describe('Booker management - visitor requests', () => {
  test.beforeEach(async ({ page }) => {
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount()
    await orchestrationApi.stubGetVisitorRequests()

    await login(page, { roles: [bapvUserRoles.STAFF_USER, bapvUserRoles.BOOKER_ADMIN] })
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should view and approve a visitor request', async ({ page }) => {
    // Home page - select booker management tile
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.bookerManagementTile.click()

    // Booker management page
    const bookerManagementPage = await BookerManagementPage.verifyOnPage(page)

    // Visitor request row
    await expect(bookerManagementPage.prisonerName(1)).toContainText('John Smith')
    await expect(bookerManagementPage.bookerEmail(1)).toContainText('booker@example.com')
    await expect(bookerManagementPage.visitorName(1)).toContainText('Mike Jones')
    await expect(bookerManagementPage.requestedDate(1)).toContainText('10/12/2025')

    // View visitor request details
    await orchestrationApi.stubGetVisitorRequestForReview(
      TestData.visitorRequestForReview({
        socialContacts: [TestData.socialContact({ firstName: 'Mike', lastName: 'Jones', dateOfBirth: '1999-11-10' })],
      }),
    )
    await orchestrationApi.stubGetLinkedVisitors()
    await bookerManagementPage.viewRequestLink(1, 'John Smith').click()
    const linkVisitorRequestPage = await LinkVisitorRequestPage.verifyOnPage(page)
    await expect(linkVisitorRequestPage.bookerEmail).toContainText('booker@example.com')
    await expect(linkVisitorRequestPage.requestedVisitorName).toContainText('Mike Jones')
    await expect(linkVisitorRequestPage.visitorDob).toContainText('10 November 1999')
    await expect(linkVisitorRequestPage.prisonerName).toContainText('John Smith')
    await expect(linkVisitorRequestPage.visitorListVisitorName(1)).toContainText('Mike Jones')
    await expect(linkVisitorRequestPage.visitorListVisitorDob(1)).toContainText('10 November 1999')
    await expect(linkVisitorRequestPage.visitorListLastVisitDate(1)).toContainText('11 October 2025')

    // Select matching visitor and confirm
    await orchestrationApi.stubApproveVisitorRequest()
    await orchestrationApi.stubGetVisitorRequests({ visitorRequestListEntries: [] })
    await linkVisitorRequestPage.visitorListSelect(1, 'Mike Jones').check()
    await linkVisitorRequestPage.confirm.click()

    // Back to booker management page with success message
    await BookerManagementPage.verifyOnPage(page)
    await expect(bookerManagementPage.messages).toContainText('You approved the request and linked Mike Jones')
  })

  test('should view and reject a visitor request (with NO existing linked contacts)', async ({ page }) => {
    // Home page - select booker management tile
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.bookerManagementTile.click()

    // Booker management page
    const bookerManagementPage = await BookerManagementPage.verifyOnPage(page)

    // View visitor request details
    await orchestrationApi.stubGetVisitorRequestForReview(
      TestData.visitorRequestForReview({
        socialContacts: [TestData.socialContact({ firstName: 'Mike', lastName: 'Jones', dateOfBirth: '1999-11-10' })],
      }),
    )
    await orchestrationApi.stubGetLinkedVisitors({ linkedVisitors: [] })
    await bookerManagementPage.viewRequestLink(1, 'John Smith').click()
    const linkVisitorRequestPage = await LinkVisitorRequestPage.verifyOnPage(page)
    await expect(linkVisitorRequestPage.bookerEmail).toContainText('booker@example.com')
    await expect(linkVisitorRequestPage.requestedVisitorName).toContainText('Mike Jones')
    await expect(linkVisitorRequestPage.visitorDob).toContainText('10 November 1999')
    await expect(linkVisitorRequestPage.prisonerName).toContainText('John Smith')
    await expect(linkVisitorRequestPage.visitorListVisitorName(1)).toContainText('Mike Jones')
    await expect(linkVisitorRequestPage.visitorListVisitorDob(1)).toContainText('10 November 1999')
    await expect(linkVisitorRequestPage.visitorListLastVisitDate(1)).toContainText('11 October 2025')

    // Select "None" to reject the request
    await orchestrationApi.stubRejectVisitorRequest()
    await orchestrationApi.stubGetVisitorRequests({ visitorRequestListEntries: [] })
    await linkVisitorRequestPage.rejectRequestRadio.check()
    await linkVisitorRequestPage.confirm.click()

    // Back to booker management page with success message
    await BookerManagementPage.verifyOnPage(page)
    await expect(bookerManagementPage.messages).toContainText('You rejected the request to link Mike Jones')
  })

  test('should view and reject a visitor request (with existing linked contacts)', async ({ page }) => {
    // Home page - select booker management tile
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.bookerManagementTile.click()

    // Booker management page
    const bookerManagementPage = await BookerManagementPage.verifyOnPage(page)

    // View visitor request details
    await orchestrationApi.stubGetVisitorRequestForReview(
      TestData.visitorRequestForReview({
        socialContacts: [TestData.socialContact({ firstName: 'Mike', lastName: 'Jones', dateOfBirth: '1999-11-10' })],
      }),
    )
    await orchestrationApi.stubGetLinkedVisitors()
    await bookerManagementPage.viewRequestLink(1, 'John Smith').click()
    const linkVisitorRequestPage = await LinkVisitorRequestPage.verifyOnPage(page)

    // Select "None of the above" for no match
    await linkVisitorRequestPage.noMatchRadio.check()
    await linkVisitorRequestPage.confirm.click()

    // Check linked visitors page
    const checkLinkedVisitorsPage = await CheckLinkedVisitorsPage.verifyOnPage(page)
    await expect(checkLinkedVisitorsPage.bookerEmail).toContainText('booker@example.com')
    await expect(checkLinkedVisitorsPage.requestedVisitorName).toContainText('Mike Jones')
    await expect(checkLinkedVisitorsPage.visitorDob).toContainText('10 November 1999')
    await expect(checkLinkedVisitorsPage.prisonerName).toContainText('John Smith')
    await expect(checkLinkedVisitorsPage.visitorListVisitorName(1)).toContainText('Jeanette Smith')
    await expect(checkLinkedVisitorsPage.visitorListVisitorDob(1)).toContainText('28 July 1986')

    // Select "No" to reject the request
    await orchestrationApi.stubRejectVisitorRequest()
    await orchestrationApi.stubGetVisitorRequests({ visitorRequestListEntries: [] })
    await checkLinkedVisitorsPage.rejectRequestRadio.check()
    await checkLinkedVisitorsPage.confirm.click()

    // Back to booker management page with success message
    await BookerManagementPage.verifyOnPage(page)
    await expect(bookerManagementPage.messages).toContainText('You rejected the request to link Mike Jones')
  })
})
