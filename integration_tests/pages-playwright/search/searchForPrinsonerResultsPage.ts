import { expect, type Locator, type Page } from '@playwright/test'
import { format } from 'date-fns'
import { Prisoner } from '../../../server/data/prisonerOffenderSearchTypes'
import { properCase } from '../../../server/utils/utils'
import AbstractPage from '../abstractPage'

export default class SearchForAPrisonerResultsPage extends AbstractPage {
    readonly searchForm: Locator
    readonly searchInput: Locator
    readonly searchButton: Locator
    readonly noResults: Locator
    readonly hasResults: Locator
    readonly resultRows: Locator
    readonly pagingLinks: Locator
    readonly nextPageLink: Locator
    readonly firstResultLink: Locator

    private constructor(page: Page) {
        super(page)

        this.searchForm = page.locator('[action="/search/prisoner"]')
        this.searchInput = page.locator('.moj-search__input')
        this.searchButton = page.locator('.moj-search__button')
        this.noResults = page.locator('#search-results-none')
        this.hasResults = page.locator('#search-results-true')
        this.resultRows = page.locator('.bapv-result-row').locator('xpath=ancestor::tr')
        this.pagingLinks = page.locator('.moj-pagination__list')
        this.nextPageLink = page.locator('.moj-pagination__item--next a').first()
        this.firstResultLink = page.locator('.bapv-result-row').first()
    }
    static async verifyOnPage(page: Page): Promise<SearchForAPrisonerResultsPage> {
        const resultsPage = new SearchForAPrisonerResultsPage(page)

        // Basic page verification
        await expect(resultsPage.searchForm).toBeVisible()
        await expect(resultsPage.searchInput).toBeVisible()
        await expect(resultsPage.searchButton).toBeVisible()

        return resultsPage
    }

    async checkResultRows(prisoners: Prisoner[], searchTerm: string): Promise<void> {
        const rowCount = await this.resultRows.count()

        for (let i = 0; i < rowCount; i++) {
            const row = this.resultRows.nth(i)
            const cells = row.locator('td')

            // Name link
            const nameLink = cells.nth(0).locator('a')
            await expect(nameLink).toHaveAttribute(
                'href',
                `/prisoner/${prisoners[i].prisonerNumber}?search=${searchTerm}`
            )
            await expect(nameLink).toHaveText(
                `${properCase(prisoners[i].lastName)}, ${properCase(prisoners[i].firstName)}`
            )

            // Prisoner number
            await expect(cells.nth(1)).toHaveText(prisoners[i].prisonerNumber)

            // Date of birth
            await expect(cells.nth(2)).toHaveText(
                format(new Date(prisoners[i].dateOfBirth), 'd MMMM yyyy')
            )
        }
    }

}