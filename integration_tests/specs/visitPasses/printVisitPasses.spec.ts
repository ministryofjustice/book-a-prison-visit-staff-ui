import { test } from '@playwright/test'
import { add, format } from 'date-fns'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'
import VisitsByDatePage from '../../pages/visitsByDate/visitsByDatePage'
import VisitPassesPage from '../../pages/visitPasses/visitPassesPage'
import TestData from '../../../server/routes/testutils/testData'
import VisitDetailsPage from '../../pages/visit/visitDetailsPage'

const shortDateFormat = 'yyyy-MM-dd'
const today = new Date()
const todayShortFormat = format(today, shortDateFormat)
const prisonId = 'HEI'

test.beforeEach(async ({ page }) => {
  await resetStubs()
  await orchestrationApi.stubSupportedPrisonIds()
  await orchestrationApi.stubGetPrison()
  await orchestrationApi.stubGetNotificationCount({})

  await login(page)
})

test.describe('Print visit passes by date (via visits by date page)', () => {
  const visitPassDtos = [
    TestData.visitPassDto({
      visitors: [
        TestData.visitPassDtoVisitor({ firstName: 'Adult', lastName: 'One' }),
        TestData.visitPassDtoVisitor({ firstName: 'Adult', lastName: 'Two' }),
        TestData.visitPassDtoVisitor({ firstName: 'Adult', lastName: 'Three' }),
      ],
    }),
    TestData.visitPassDto({
      visitors: [
        TestData.visitPassDtoVisitor({ firstName: 'Adult', lastName: 'One' }),
        TestData.visitPassDtoVisitor({ firstName: 'Adult', lastName: 'Two' }),
        TestData.visitPassDtoVisitor({ firstName: 'Adult', lastName: 'Three' }),

        TestData.visitPassDtoVisitor({ firstName: 'Child', lastName: 'One', dateOfBirth: '2020-01-01' }),
        TestData.visitPassDtoVisitor({ firstName: 'Child', lastName: 'Two', dateOfBirth: '2026-02-01' }),
        TestData.visitPassDtoVisitor({ firstName: 'Child', lastName: 'Three', dateOfBirth: '2026-06-01' }),
      ],
    }),
  ]

  test('should navigate to print visit passes page and trigger print dialog', async ({ page }) => {
    await orchestrationApi.stubSessionSchedule({ prisonId, date: todayShortFormat, sessionSchedule: [] })
    await orchestrationApi.stubGetVisitsWithoutSessionTemplate({ prisonId, sessionDate: todayShortFormat, visits: [] })
    await orchestrationApi.stubIsBlockedDate({ prisonId, excludeDate: todayShortFormat, excludeDates: [] })
    await orchestrationApi.stubGetVisitPasses({ date: todayShortFormat, visitPassDtos })

    // Navigate to Visits by date page
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.viewVisitsTile.click()
    const visitsByDatePage = await VisitsByDatePage.verifyOnPage(page)

    // Click 'Print visit passes' button
    await visitsByDatePage.printVisitPasses.click()
    const visitPassesPage = await VisitPassesPage.verifyOnPage(page, 'Print visit passes')

    // Visit passes page
    // TODO extend to check pass contents

    // Print button should trigger print dialog
    await visitPassesPage.printAllAndCheckForPrintDialog()
  })
})

test.describe('Print single visit pass by reference (via visit booking details page)', () => {
  test('should navigate to print visit passes page for a single visit and trigger print dialog', async ({ page }) => {
    const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)
    const visitDetails = TestData.visitBookingDetailsRaw({
      startTimestamp: `${futureVisitDate}T12:00:00`,
      endTimestamp: `${futureVisitDate}T14:00:00`,
    })
    const visitPassDto = TestData.visitPassDto({ visitDate: futureVisitDate })

    await orchestrationApi.stubGetVisitDetailed(visitDetails)
    await orchestrationApi.stubGetVisitPass({ reference: visitDetails.reference, visitPassDto })

    // Navigate to Visit booking details by date page
    await page.goto(`/visit/${visitDetails.reference}`)
    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'Visit booking details')

    // Click 'Print visit passes' button
    await visitDetailsPage.printVisitPass.click()
    const visitPassesPage = await VisitPassesPage.verifyOnPage(page, 'Print visit pass')

    // Visit passes page
    // TODO extend to check pass contents

    // Print button should trigger print dialog
    await visitPassesPage.printAllAndCheckForPrintDialog()
  })
})
