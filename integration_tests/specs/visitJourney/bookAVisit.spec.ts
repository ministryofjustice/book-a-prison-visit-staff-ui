import { expect, test } from '@playwright/test'
import { addDays, format, sub } from 'date-fns'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages-playwright/homePage'
import SearchForAPrisonerPage from '../../pages-playwright/search/searchForAPrisonerPage'
import SearchForAPrisonerResultsPage from '../../pages-playwright/search/searchForPrinsonerResultsPage'
import PrisonerProfilePage from '../../pages-playwright/prisoner/prisonerProfilePage'
import SelectVisitorsPage from '../../pages-playwright/visitJourney/selectVisitorsPage'
import TestData from '../../../server/routes/testutils/testData'

test.describe('Book a visit', () => {
    const shortDateFormat = 'yyyy-MM-dd'
    const today = new Date()

    test.beforeEach(async () => {
        await orchestrationApi.stubSupportedPrisonIds()
        await orchestrationApi.stubGetPrison()
        await orchestrationApi.stubGetNotificationCount({})
    })

    test.afterEach(async () => {
        await resetStubs()
    })

    test('Should complete the book a visit journey', async ({ page }) => {
        const adultDob = format(sub(today, { years: 18 }), shortDateFormat)
        const childDob = format(sub(today, { years: 5 }), shortDateFormat)

        const contacts = [
            TestData.contact({
                dateOfBirth: adultDob,
                restrictions: [TestData.restriction()], 
            }),
            TestData.contact({
                personId: 4322,
                firstName: 'Bob',
                lastName: 'Smith',                   
                dateOfBirth: childDob,
                relationshipCode: 'SON',
                relationshipDescription: 'Son',
                restrictions: [],                      
                addresses: [TestData.address()],       
            }),
        ]
        // Convert to social contacts shape expected by API
        const socialContacts = contacts.map(contact => ({
            personId: contact.personId!,
            firstName: contact.firstName,
            lastName: contact.lastName,
            dateOfBirth: contact.dateOfBirth!,
            restrictions: contact.restrictions || [],
        }))

        const prisoner = TestData.prisoner()
        const { prisonerNumber: offenderNo } = prisoner

        // --- Stub prisoner profile ---
        await orchestrationApi.stubPrisonerProfile(
            TestData.prisonerProfile({
                prisonerId: offenderNo,
                firstName: 'John',
                lastName: 'Smith',
                alerts: [
                    {
                        alertType: 'U',
                        alertTypeDescription: 'COVID unit management',
                        alertCode: 'UPIU',
                        alertCodeDescription: 'Protective Isolation Unit',
                        comment: 'Alert comment \n This part is hidden by default',
                        startDate: '2023-01-02',
                        active: true,
                    },
                ],
                prisonerRestrictions: [TestData.offenderRestriction()],
            })
        )

        // --- Stub prisoner search API results ---
        await orchestrationApi.stubPrisoners({
            term: offenderNo,
            results: {
                totalElements: 1,
                totalPages: 1,
                content: [
                    {
                        prisonerNumber: offenderNo,
                        firstName: 'John',
                        lastName: 'Smith',
                        dateOfBirth: '1990-01-01',
                    },
                ],
            },
        })

        // --- Stub the /offenderSearch/prison endpoint ---
        await page.route('**/offenderSearch/prison/**/prisoners**', async (route) => {
            const response = {
                totalElements: 1,
                totalPages: 1,
                content: [
                    {
                        prisonerNumber: offenderNo,
                        firstName: 'John',
                        lastName: 'Smith',
                        dateOfBirth: '1990-01-01',
                    },
                ],
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(response),
            })
        })

        // --- Login and start journey ---
        await login(page)
        const homePage = await HomePage.verifyOnPage(page)
        await homePage.bookOrChangeVisitTile.click()

        // --- Navigate to search page ---
        const searchPage = await SearchForAPrisonerPage.verifyOnPage(page)

        // --- Perform search ---
        await searchPage.searchInput.fill(offenderNo)
        await searchPage.searchButton.click()

        // --- Verify search results page ---
        const searchResultsPage = await SearchForAPrisonerResultsPage.verifyOnPage(page)
        await expect(searchResultsPage.resultRows.first()).toBeVisible()
        await expect(searchResultsPage.resultRows).toHaveCount(1)
        await expect(searchResultsPage.firstResultLink).toHaveText('Smith, John')

        // // --- Go to prisoner profile page ---
        await searchResultsPage.firstResultLink.click()
        const profilePage = await PrisonerProfilePage.verifyOnPage(page)
        await orchestrationApi.stubPrisonerSocialContacts({
            offenderNo,
            contacts: socialContacts
        })
        await profilePage.bookAVisitButton.click()

        // // --- Select visitors page ---
        const selectVisitorsPage = await SelectVisitorsPage.verifyOnPage(page)
        // await selectVisitorsPage.getVisitor(contacts[0].personId).check()
        // await selectVisitorsPage.getVisitor(contacts[1].personId).check()



    })


})
