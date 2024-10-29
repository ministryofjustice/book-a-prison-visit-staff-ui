import { format } from 'date-fns'
import HomePage from '../pages/home'
import Page from '../pages/page'
import BlockVisitDatesPage from '../pages/blockVisitDates'
import BlockVisitDateConfirmationPage from '../pages/blockVisitDateConfirmation'
import TestData from '../../server/routes/testutils/testData'

context('Block visit dates', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  const today = new Date()
  const firstOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const firstOfNextMonthShort = format(firstOfNextMonth, shortDateFormat)
  const firstOfNextMonthLong = format(firstOfNextMonth, longDateFormat)

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should go to block dates listing page and block a new date', () => {
    cy.task('stubGetFutureBlockedDates', {})

    const homePage = Page.verifyOnPage(HomePage)
    homePage.blockDatesTile().click()

    const blockedVisitPage = Page.verifyOnPage(BlockVisitDatesPage)
    blockedVisitPage.noBlockedDates().contains('no upcoming blocked dates')

    // open date picker and select 1st of next month
    blockedVisitPage.datePicker.datePickerToggleCalendar()
    blockedVisitPage.datePicker.goToNextMonth()
    blockedVisitPage.datePicker.selectDay(1)

    // Continue to Are you sure page
    cy.task('stubGetBookedVisitCountByDate', { date: firstOfNextMonthShort })
    blockedVisitPage.continue()
    const blockVisitDateConfirmationPage = Page.verifyOnPageTitle(
      BlockVisitDateConfirmationPage,
      format(firstOfNextMonth, longDateFormat),
    )

    // select Yes and confirm
    cy.task('stubBlockVisitDate', { date: firstOfNextMonthShort })
    cy.task('stubGetFutureBlockedDates', {
      blockedDates: [TestData.prisonExcludeDateDto({ excludeDate: firstOfNextMonthShort })],
    })
    blockVisitDateConfirmationPage.selectYes()
    blockVisitDateConfirmationPage.continue()

    // back to listings page and see success message and new blocked date
    blockedVisitPage.checkOnPage()
    blockedVisitPage.getMessage().contains(`Visits are blocked for ${firstOfNextMonthLong}.`)
    blockedVisitPage.blockedDate(1).contains(firstOfNextMonthLong)
    blockedVisitPage.blockedBy(1).contains('User one')
    blockedVisitPage.unblockLink(1).contains('Unblock')
  })

  it('should go to block dates listing page and unblock a date', () => {
    cy.task('stubGetFutureBlockedDates', {
      blockedDates: [TestData.prisonExcludeDateDto({ excludeDate: firstOfNextMonthShort })],
    })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.blockDatesTile().click()

    // Listing page with existing blocked date
    const blockedVisitPage = Page.verifyOnPage(BlockVisitDatesPage)
    blockedVisitPage.blockedDate(1).contains(firstOfNextMonthLong)
    blockedVisitPage.blockedBy(1).contains('User one')
    blockedVisitPage.unblockLink(1).contains('Unblock')

    // Unblock date
    cy.task('stubUnblockVisitDate', { date: firstOfNextMonthShort })
    cy.task('stubGetFutureBlockedDates', {})
    blockedVisitPage.unblockLink(1).click()

    // back to listings page and see success message and no blocked dates
    blockedVisitPage.checkOnPage()
    blockedVisitPage.getMessage().contains(`Visits are unblocked for ${firstOfNextMonthLong}.`)
    blockedVisitPage.noBlockedDates().contains('no upcoming blocked dates')
  })
})
