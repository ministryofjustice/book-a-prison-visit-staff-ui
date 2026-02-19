import { expect, test } from '@playwright/test'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages-playwright/homePage'
import SearchForAPrisonerPage from '../../pages-playwright/search/searchForAPrisonerPage'
import SearchForAPrisonerResultsPage from '../../pages-playwright/search/searchForAPrisonerResultsPage'
import TestData from '../../../server/routes/testutils/testData'
import prisonerSearch from '../../mockApis/prisonerSearch'

test.describe('Search for a prisoner', () => {
  const prisoner = TestData.prisoner()
  const { prisonerNumber } = prisoner

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
    await login(page)
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should show Search For A Prisoner page', async ({ page }) => {
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.bookOrChangeVisitTile.click()

    const searchForAPrisonerPage = await SearchForAPrisonerPage.verifyOnPage(page)
    await expect(searchForAPrisonerPage.searchForm).toBeVisible()
  })

  test.describe('when there are no results', () => {
    test('should show that there are no results', async ({ page }) => {
      await prisonerSearch.stubPrisoners({ term: prisonerNumber })
      await prisonerSearch.stubPrisonerById(prisoner)

      const homePage = await HomePage.verifyOnPage(page)
      await homePage.bookOrChangeVisitTile.click()

      const searchForAPrisonerPage = await SearchForAPrisonerPage.verifyOnPage(page)
      await searchForAPrisonerPage.searchInput.fill(prisonerNumber)
      await searchForAPrisonerPage.searchButton.click()

      const resultsPage = await SearchForAPrisonerResultsPage.verifyOnPage(page)
      await expect(resultsPage.noResults).toBeVisible()
    })

    test.describe('when there is one page of results', () => {
      test('should list the results with no paging', async ({ page }) => {
        const searchTerm = 'name'
        const results = [
          TestData.prisoner(),
          TestData.prisoner({
            firstName: 'BOB',
            prisonerNumber: 'B1234CD',
            dateOfBirth: '2000-03-02',
          }),
        ]

        await prisonerSearch.stubPrisoners({
          term: searchTerm,
          results: {
            totalElements: results.length,
            totalPages: 1,
            content: results,
          },
        })

        const homePage = await HomePage.verifyOnPage(page)
        await homePage.bookOrChangeVisitTile.click()

        const searchForAPrisonerPage = await SearchForAPrisonerPage.verifyOnPage(page)
        await searchForAPrisonerPage.searchInput.fill(searchTerm)
        await searchForAPrisonerPage.searchButton.click()

        const resultsPage = await SearchForAPrisonerResultsPage.verifyOnPage(page)
        await expect(resultsPage.hasResults).toBeVisible()
        await expect(resultsPage.resultRows).toHaveCount(results.length)
        await resultsPage.checkResultRows(results, searchTerm)
      })
    })

    test.describe('when there is more than one page of results', () => {
      test('should list the results with paging', async ({ page }) => {
        const searchTerm = 'name'

        const resultsPage1 = Array.from({ length: 10 }, (_, index) => {
          const num = (index + 1).toString().padStart(2, '0')
          return TestData.prisoner({
            firstName: `FORENAME_${num}`,
            lastName: `SURNAME_${num}`,
            prisonerNumber: `A10${num}BC`,
            dateOfBirth: `2000-05-${num}`,
          })
        })

        const resultsPage2 = [
          TestData.prisoner({
            firstName: 'FORENAME_11',
            lastName: 'SURNAME_11',
            prisonerNumber: 'A1011BC',
            dateOfBirth: '2000-05-11',
          }),
        ]

        // Stub first page
        await prisonerSearch.stubPrisoners({
          term: searchTerm,
          results: {
            totalElements: 11,
            totalPages: 2,
            content: resultsPage1,
          },
        })

        const homePage = await HomePage.verifyOnPage(page)
        await homePage.bookOrChangeVisitTile.click()

        const searchForAPrisonerPage = await SearchForAPrisonerPage.verifyOnPage(page)
        await searchForAPrisonerPage.searchInput.fill(searchTerm)
        await searchForAPrisonerPage.searchButton.click()

        const resultsPage = await SearchForAPrisonerResultsPage.verifyOnPage(page)
        await expect(resultsPage.hasResults).toBeVisible()
        await expect(resultsPage.resultRows).toHaveCount(10)
        await resultsPage.checkResultRows(resultsPage1, searchTerm)

        // Stub second page
        await prisonerSearch.stubPrisoners({
          term: searchTerm,
          page: '1',
          results: {
            totalElements: 11,
            totalPages: 2,
            content: resultsPage2,
          },
        })

        await resultsPage.nextPageLink.click()
        await expect(resultsPage.resultRows).toHaveCount(1)
        await resultsPage.checkResultRows(resultsPage2, searchTerm)
      })
    })
  })
})
