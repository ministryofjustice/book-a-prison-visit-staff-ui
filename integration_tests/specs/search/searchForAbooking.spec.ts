import { expect, test } from '@playwright/test'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import TestData from '../../../server/routes/testutils/testData'
import HomePage from '../../pages/homePage'
import SearchForBookingByReferencePage from '../../pages/search/searchForBookingByReferencePage'
import SearchForBookingByReferenceResultsPage from '../../pages/search/searchForBookingByReferenceResultsPage'
import SearchForBookingByPrisonerPage from '../../pages/search/searchForBookingByPrisonerPage'
import SearchForBookingByPrisonerResultsPage from '../../pages/search/searchForBookingByPrisonerResultsPage'
import VisitDetailsPage from '../../pages/visit/visitDetailsPage'
import PrisonerProfilePage from '../../pages/prisoner/prisonerProfilePage'
import prisonerSearch from '../../mockApis/prisonerSearch'

test.describe('Search for a booking by reference', () => {
  const prisoner = TestData.prisoner()
  const { prisonerNumber: offenderNo } = prisoner

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
    await login(page)
  })

  test('should search via booking reference then navigate to the summary page', async ({ page }) => {
    // Home page
    const homePage = await HomePage.verifyOnPage(page)
    const visit = TestData.visit()

    await homePage.bookOrChangeVisitTile.click()

    // Search by prisoner page
    const searchForBookingByPrisonerPage = await SearchForBookingByPrisonerPage.verifyOnPage(page)
    await searchForBookingByPrisonerPage.searchByReferenceLink.click()

    // Search by reference page
    const searchForBookingByReferencePage = await SearchForBookingByReferencePage.verifyOnPage(page)

    await searchForBookingByReferencePage.enterVisitReference('ab-cd-ef-gh')

    await prisonerSearch.stubPrisonerById(prisoner)
    await orchestrationApi.stubVisit(visit)

    await searchForBookingByReferencePage.continueButton().click()

    const searchBookingByReferenceResultsPage = await SearchForBookingByReferenceResultsPage.verifyOnPage(page)

    await expect(searchBookingByReferenceResultsPage.visitReference).toHaveText('ab-cd-ef-gh')
    await expect(searchBookingByReferenceResultsPage.prisonerName).toHaveText('John Smith')
    await expect(searchBookingByReferenceResultsPage.prisonerNumber).toHaveText(offenderNo)
    await expect(searchBookingByReferenceResultsPage.visitStatus).toHaveText('Booked')
    // Stub the detailed visit data
    await orchestrationApi.stubGetVisitDetailed(TestData.visitBookingDetailsRaw())

    // Click the visit reference link to go to Visit Details page
    await searchBookingByReferenceResultsPage.visitReferenceLink.click()

    // Verify Visit Details page
    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'booking')

    await expect(visitDetailsPage.visitReference).toHaveText('ab-cd-ef-gh')
    await expect(visitDetailsPage.prisonerName).toHaveText('John Smith')
  })

  test('search via prisonerId then navigate to visit details', async ({ page }) => {
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.bookOrChangeVisitTile.click()

    const searchByPrisonerPage = await SearchForBookingByPrisonerPage.verifyOnPage(page)
    await searchByPrisonerPage.enterSearchTerm(offenderNo)

    await prisonerSearch.stubPrisoners({
      term: offenderNo,
      results: {
        totalElements: 1,
        totalPages: 1,
        content: [prisoner],
      },
    })

    await searchByPrisonerPage.continueButton.click()

    const resultsPage = await SearchForBookingByPrisonerResultsPage.verifyOnPage(page)
    await resultsPage.expectFirstRowContains('Smith, John')
    await resultsPage.expectFirstRowContains(offenderNo)
    await resultsPage.expectFirstRowContains('2 April 1975')

    await orchestrationApi.stubPrisonerProfile(TestData.prisonerProfile({ visits: [TestData.visitSummary()] }))
    await resultsPage.selectFirstPrisoner()

    const profilePage = await PrisonerProfilePage.verifyOnPage(page, 'Smith, John')
    await orchestrationApi.stubGetVisitDetailed(TestData.visitBookingDetailsRaw())

    await profilePage.visitTabReference('ab-cd-ef-gh').nth(0).click()

    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'booking')
    await expect(visitDetailsPage.visitReference).toHaveText('ab-cd-ef-gh')
    await expect(visitDetailsPage.prisonerName).toHaveText('John Smith')
  })
})
