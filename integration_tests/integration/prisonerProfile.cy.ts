import HomePage from '../pages/home'
import Page from '../pages/page'
import PrisonerProfilePage from '../pages/prisonerProfile'
import SearchForAPrisonerPage from '../pages/searchForAPrisoner'
import SearchForAPrisonerResultsPage from '../pages/searchForAPrisonerResults'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'
import {
  prisonerDatePretty,
  nextIepAdjustDate,
  nextPrivIepAdjustDate,
  formatVisitType,
  visitDateAndTime,
  properCase,
} from '../../server/utils/utils'
import { InmateDetail, VisitBalances } from '../../server/data/prisonApiTypes'
import { prisonerProfileData } from './prisonerProfile.data'
import { Visit } from '../../server/data/visitSchedulerApiTypes'
import TestData from '../../server/routes/testutils/testData'

context.skip('Prisoner profile page', () => {
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisons')
    cy.signIn()
  })

  it('should show the prisoner profile page', () => {
    const {
      prisoner,
      offender,
      visitBalances,
      upcomingVisits,
      pastVisits,
    }: {
      prisoner: Partial<Prisoner>
      offender: Partial<InmateDetail>
      visitBalances: VisitBalances
      upcomingVisits: Visit[]
      pastVisits: Visit[]
    } = prisonerProfileData(prisonerNumber)
    const results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } = {
      totalPages: 1,
      totalElements: 1,
      content: [prisoner],
    }
    cy.task('stubPrisoners', { results })
    const homePage = Page.verifyOnPage(HomePage)
    homePage.bookAVisitTile().click()

    const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
    searchForAPrisonerPage.searchInput().clear().type(prisonerNumber)
    searchForAPrisonerPage.searchButton().click()

    const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
    searchForAPrisonerResultsPage.resultRows().should('have.length', results.content.length)
    searchForAPrisonerResultsPage
      .firstResultLink()
      .invoke('text')
      .then(pageTitle => {
        cy.task('stubBookings', prisonerNumber)
        cy.task('stubOffender', offender)
        cy.task('stubPrisonerById', { prisonerNumber, currentIncentive: { level: { description: 'Standard' } } })
        cy.task('stubVisitBalances', { offenderNo: prisonerNumber, visitBalances })
        cy.task('stubUpcomingVisits', { offenderNo: prisonerNumber, upcomingVisits })
        cy.task('stubPastVisits', { offenderNo: prisonerNumber, pastVisits })
        cy.task('stubPrisonerSocialContacts', prisonerNumber)
        searchForAPrisonerResultsPage.firstResultLink().click()

        const prisonerProfilePage = new PrisonerProfilePage(pageTitle)
        const isIntTest = true

        prisonerProfilePage.prisonNumber().contains(prisonerNumber)
        prisonerProfilePage.dateOfBirth().contains(prisonerDatePretty({ dateToFormat: offender.dateOfBirth }))
        prisonerProfilePage
          .location()
          .contains(`${offender.assignedLivingUnit.description}, ${offender.assignedLivingUnit.agencyName}`)
        prisonerProfilePage.category().contains(offender.category)
        prisonerProfilePage.incentiveLevel().contains('Standard')
        prisonerProfilePage.convictionStatus().contains('Convicted')
        prisonerProfilePage.alertCount().contains(offender.activeAlertCount)
        prisonerProfilePage.remainingVOs().contains(visitBalances.remainingVo)
        prisonerProfilePage.remainingPVOs().contains(visitBalances.remainingPvo)
        prisonerProfilePage.flaggedAlerts().eq(0).contains(offender.alerts[0].alertCodeDescription)

        prisonerProfilePage.visitTabVORemaining().contains(visitBalances.remainingVo)
        prisonerProfilePage
          .visitTabVOLastAdjustment()
          .contains(prisonerDatePretty({ dateToFormat: visitBalances.latestIepAdjustDate }))
        prisonerProfilePage.visitTabVONextAdjustment().contains(nextIepAdjustDate(visitBalances.latestIepAdjustDate))
        prisonerProfilePage.visitTabPVORemaining().contains(visitBalances.remainingPvo)
        prisonerProfilePage
          .visitTabPVOLastAdjustment()
          .contains(prisonerDatePretty({ dateToFormat: visitBalances.latestPrivIepAdjustDate }))
        prisonerProfilePage
          .visitTabPVONextAdjustment()
          .contains(nextPrivIepAdjustDate(visitBalances.latestPrivIepAdjustDate))

        prisonerProfilePage.selectActiveAlertsTab()
        prisonerProfilePage.alertsTabType().eq(0).contains(offender.alerts[0].alertTypeDescription)
        prisonerProfilePage.alertsTabCode().eq(0).contains(offender.alerts[0].alertCodeDescription)
        prisonerProfilePage.alertsTabComment().eq(0).contains(offender.alerts[0].comment)
        prisonerProfilePage
          .alertsTabCreated()
          .eq(0)
          .contains(prisonerDatePretty({ dateToFormat: offender.alerts[0].dateCreated }))
        prisonerProfilePage.alertsTabExpires().eq(0).contains('Not entered')

        prisonerProfilePage.selectUpcomingVisitsTab()
        prisonerProfilePage.upcomingTabType().eq(0).contains(formatVisitType(upcomingVisits[0].visitType))
        prisonerProfilePage.upcomingTabLocation().eq(0).contains('Hewell (HMP)')
        prisonerProfilePage
          .upcomingTabDateAndTime()
          .eq(0)
          .contains(
            visitDateAndTime({
              startTimestamp: upcomingVisits[0].startTimestamp,
              endTimestamp: upcomingVisits[0].endTimestamp,
              isIntTest,
            }),
          )
        prisonerProfilePage.upcomingTabVisitors().eq(0).contains('John Smith')

        prisonerProfilePage.selectVisitsHistoryTab()
        prisonerProfilePage.pastTabType().eq(0).contains(formatVisitType(pastVisits[0].visitType))
        prisonerProfilePage.pastTabLocation().eq(0).contains('Hewell (HMP)')
        prisonerProfilePage
          .pastTabDateAndTime()
          .eq(0)
          .contains(
            visitDateAndTime({
              startTimestamp: pastVisits[0].startTimestamp,
              endTimestamp: pastVisits[0].endTimestamp,
              isIntTest,
            }),
          )
        prisonerProfilePage.pastTabVisitors().eq(0).contains('John Smith')
        prisonerProfilePage.pastTabStatus().eq(0).contains(properCase(pastVisits[0].visitStatus))
      })
  })
})
