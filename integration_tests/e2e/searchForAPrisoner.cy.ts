import IndexPage from '../pages/index'
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
import {
  singlePageSearchResults,
  multiplePageSearchResultsPage1,
  multiplePageSearchResultsPage2,
  prisonerProfileData,
} from './searchForAPrisoner.data'
import { Visit } from '../../server/data/visitSchedulerApiTypes'

context('Search for a prisoner', () => {
  const prisonerNumber = 'A1234BC'
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
  })

  it('should show Search For A Prisoner page', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage
      .bookAVisitLink()
      .invoke('attr', 'href')
      .then(href => {
        cy.visit(href)

        const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
        searchForAPrisonerPage.backLink()
        searchForAPrisonerPage.searchForm()
      })
  })

  context('when there are no results', () => {
    it('should show that there are no results', () => {
      const results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } = {
        totalPages: 0,
        totalElements: 0,
        content: [],
      }
      cy.task('stubGetPrisoners', { results })
      cy.signIn()
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage.bookAVisitLink().click()
      const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
      searchForAPrisonerPage.searchInput().clear().type(prisonerNumber)
      searchForAPrisonerPage.searchButton().click()

      const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
      searchForAPrisonerResultsPage.noResults()
    })
  })

  context('when there is one page of results', () => {
    it('should list the results with no paging', () => {
      const results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } =
        singlePageSearchResults(prisonerNumber)
      cy.task('stubGetPrisoners', { results })
      cy.signIn()
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage.bookAVisitLink().click()

      const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
      searchForAPrisonerPage.searchInput().clear().type(prisonerNumber)
      searchForAPrisonerPage.searchButton().click()

      const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
      searchForAPrisonerResultsPage.hasResults()
      searchForAPrisonerResultsPage.resultRows().should('have.length', results.content.length)

      results.content.forEach((prisoner, index) => {
        searchForAPrisonerResultsPage
          .resultRows()
          .eq(index)
          .within(() => {
            cy.get('td').eq(0).contains(`${prisoner.lastName}, ${prisoner.firstName}`)
            cy.get('td').eq(1).contains(prisoner.prisonerNumber)
            cy.get('td')
              .eq(2)
              .contains(prisonerDatePretty({ dateToFormat: prisoner.dateOfBirth }))
          })
      })
    })
  })

  context('when there is more than one page of results', () => {
    it('should list the results with paging', () => {
      const pageSize = 10
      const resultsPage1: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } =
        multiplePageSearchResultsPage1(prisonerNumber)
      const resultsPage2: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } =
        multiplePageSearchResultsPage2()
      cy.task('stubGetPrisoners', { results: resultsPage1 })
      cy.signIn()
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage.bookAVisitLink().click()

      const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
      searchForAPrisonerPage.searchInput().clear().type(prisonerNumber)
      searchForAPrisonerPage.searchButton().click()

      const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
      searchForAPrisonerResultsPage.hasResults()
      searchForAPrisonerResultsPage.pagingLinks().should('exist')
      searchForAPrisonerResultsPage.resultRows().should('have.length', pageSize)

      resultsPage1.content.forEach((prisoner, index) => {
        searchForAPrisonerResultsPage
          .resultRows()
          .eq(index)
          .within(() => {
            cy.get('td').eq(0).contains(`${prisoner.lastName}, ${prisoner.firstName}`)
            cy.get('td').eq(1).contains(prisoner.prisonerNumber)
            cy.get('td')
              .eq(2)
              .contains(prisonerDatePretty({ dateToFormat: prisoner.dateOfBirth }))
          })
      })

      cy.task('stubGetPrisoners', { results: resultsPage2, page: '1' })
      searchForAPrisonerResultsPage.nextPageLink().click()
      searchForAPrisonerResultsPage.hasResults()
      searchForAPrisonerResultsPage.pagingLinks().should('exist')
      searchForAPrisonerResultsPage.resultRows().should('have.length', 1)

      searchForAPrisonerResultsPage
        .resultRows()
        .eq(0)
        .within(() => {
          cy.get('td').eq(0).contains(`${resultsPage2.content[0].lastName}, ${resultsPage2.content[0].firstName}`)
          cy.get('td').eq(1).contains(resultsPage2.content[0].prisonerNumber)
          cy.get('td')
            .eq(2)
            .contains(prisonerDatePretty({ dateToFormat: resultsPage2.content[0].dateOfBirth }))
        })
    })
  })

  context('view single prisoner', () => {
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
      cy.task('stubGetPrisoners', { results })
      cy.signIn()
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage.bookAVisitLink().click()

      const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
      searchForAPrisonerPage.searchInput().clear().type(prisonerNumber)
      searchForAPrisonerPage.searchButton().click()

      const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
      searchForAPrisonerResultsPage.resultRows().should('have.length', results.content.length)
      searchForAPrisonerResultsPage
        .firstResultLink()
        .invoke('text')
        .then(pageTitle => {
          cy.task('stubGetBookings', prisonerNumber)
          cy.task('stubGetOffender', offender)
          cy.task('stubGetVisitBalances', { offenderNo: prisonerNumber, visitBalances })
          cy.task('stubGetUpcomingVisits', { offenderNo: prisonerNumber, upcomingVisits })
          cy.task('stubGetPastVisits', { offenderNo: prisonerNumber, pastVisits })
          cy.task('stubGetPrisonerSocialContacts', prisonerNumber)
          searchForAPrisonerResultsPage.firstResultLink().click()

          const prisonerProfilePage = new PrisonerProfilePage(pageTitle)
          const isIntTest = true

          prisonerProfilePage.prisonNumber().contains(prisonerNumber)
          prisonerProfilePage.dateOfBirth().contains(prisonerDatePretty({ dateToFormat: offender.dateOfBirth }))
          prisonerProfilePage
            .location()
            .contains(`${offender.assignedLivingUnit.description}, ${offender.assignedLivingUnit.agencyName}`)
          prisonerProfilePage.category().contains(offender.category)
          prisonerProfilePage.incentiveLevel().contains(offender.privilegeSummary.iepLevel)
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
          prisonerProfilePage
            .upcomingTabType()
            .eq(0)
            .contains(
              formatVisitType({
                visitType: upcomingVisits[0].visitType,
                visitRestriction: upcomingVisits[0].visitRestriction,
                isIntTest,
              }),
            )
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
          prisonerProfilePage
            .pastTabType()
            .eq(0)
            .contains(
              formatVisitType({
                visitType: pastVisits[0].visitType,
                visitRestriction: pastVisits[0].visitRestriction,
                isIntTest,
              }),
            )
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
})
