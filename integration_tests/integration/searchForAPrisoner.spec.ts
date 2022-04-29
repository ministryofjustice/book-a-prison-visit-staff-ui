import IndexPage from '../pages/index'
import Page from '../pages/page'
import PrisonerProfilePage from '../pages/prisonerProfile'
import SearchForAPrisonerPage from '../pages/searchForAPrisoner'
import SearchForAPrisonerResultsPage from '../pages/searchForAPrisonerResults'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'
import { prisonerDatePretty } from '../../server/utils/utils'
import { InmateDetail, VisitBalances } from '../../server/data/prisonApiTypes'
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
      cy.task('stubGetPrisoners', results)
      cy.signIn()
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage
        .bookAVisitLink()
        .invoke('attr', 'href')
        .then(href => {
          cy.visit(href)

          const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
          searchForAPrisonerPage.searchInput().clear().type(prisonerNumber)
          searchForAPrisonerPage.searchButton().click()

          const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
          searchForAPrisonerResultsPage.noResults()
        })
    })
  })

  context('when there is one page of results', () => {
    it('should list the results with no paging', () => {
      const results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } = {
        totalPages: 1,
        totalElements: 2,
        content: [
          {
            lastName: 'Last Name 1',
            firstName: 'First Name 1',
            prisonerNumber,
            dateOfBirth: '2000-01-01',
          },
          {
            lastName: 'Last Name 2',
            firstName: 'First Name 2',
            prisonerNumber: 'DE5678F',
            dateOfBirth: '2000-01-02',
          },
        ],
      }
      cy.task('stubGetPrisoners', results)
      cy.signIn()
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage
        .bookAVisitLink()
        .invoke('attr', 'href')
        .then(href => {
          cy.visit(href)

          const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
          searchForAPrisonerPage.searchInput().clear().type(prisonerNumber)
          searchForAPrisonerPage.searchButton().click()

          const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
          searchForAPrisonerResultsPage.hasResults()
          searchForAPrisonerResultsPage.pagingLinks().should('not.exist')
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
  })

  context('when there is more than one page of results', () => {
    it('should list the results with paging', () => {
      const pageSize = 10
      const resultsPage1: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } = {
        totalPages: 2,
        totalElements: 11,
        content: [
          {
            lastName: 'Last Name 1',
            firstName: 'First Name 1',
            prisonerNumber,
            dateOfBirth: '2000-01-01',
          },
          {
            lastName: 'Last Name 2',
            firstName: 'First Name 2',
            prisonerNumber: 'D5678EF',
            dateOfBirth: '2000-01-02',
          },
          {
            lastName: 'Last Name 3',
            firstName: 'First Name 3',
            prisonerNumber: 'D1678EF',
            dateOfBirth: '2000-01-03',
          },
          {
            lastName: 'Last Name 4',
            firstName: 'First Name 4',
            prisonerNumber: 'D2678EF',
            dateOfBirth: '2000-01-04',
          },
          {
            lastName: 'Last Name 5',
            firstName: 'First Name 5',
            prisonerNumber: 'D3678EF',
            dateOfBirth: '2000-01-05',
          },
          {
            lastName: 'Last Name 6',
            firstName: 'First Name 6',
            prisonerNumber: 'D4678EF',
            dateOfBirth: '2000-01-06',
          },
          {
            lastName: 'Last Name 7',
            firstName: 'First Name 7',
            prisonerNumber: 'D6678EF',
            dateOfBirth: '2000-01-07',
          },
          {
            lastName: 'Last Name 8',
            firstName: 'First Name 8',
            prisonerNumber: 'D7678EF',
            dateOfBirth: '2000-01-08',
          },
          {
            lastName: 'Last Name 9',
            firstName: 'First Name 9',
            prisonerNumber: 'D8678EF',
            dateOfBirth: '2000-01-09',
          },
          {
            lastName: 'Last Name 10',
            firstName: 'First Name 10',
            prisonerNumber: 'D9678EF',
            dateOfBirth: '2000-01-10',
          },
        ],
      }
      const resultsPage2: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } = {
        totalPages: 2,
        totalElements: 11,
        content: [
          {
            lastName: 'Last Name 11',
            firstName: 'First Name 11',
            prisonerNumber: 'D9678EG',
            dateOfBirth: '2000-01-11',
          },
        ],
      }
      cy.task('stubGetPrisoners', resultsPage1)
      cy.signIn()
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage
        .bookAVisitLink()
        .invoke('attr', 'href')
        .then(href => {
          cy.visit(href)

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

          cy.task('stubGetPrisoners', resultsPage2)
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
  })

  context('view single prisoner', () => {
    it('should show the prisoner profile page', () => {
      const prisoner: Partial<Prisoner> = {
        lastName: 'Last Name 1',
        firstName: 'First Name 1',
        prisonerNumber,
        dateOfBirth: '2000-01-01',
      }
      const offender: Partial<InmateDetail> = {
        lastName: 'Last Name 1',
        firstName: 'First Name 1',
        offenderNo: prisonerNumber,
        dateOfBirth: '2000-01-01',
        assignedLivingUnit: {
          description: 'ALU Description',
          agencyName: 'ALU Description',
          agencyId: 'HEI',
          locationId: 123,
        },
        category: 'SomeCategory',
        privilegeSummary: {
          iepLevel: 'Basic',
          iepDate: '2022-01-01',
          bookingId: 1234,
          daysSinceReview: 3,
        },
        activeAlertCount: 2,
        alerts: [
          {
            active: true,
            alertCode: 'UPIU',
            alertCodeDescription: 'Protective Isolation Unit',
            alertId: 1234,
            alertType: 'U',
            alertTypeDescription: 'COVID unit management',
            bookingId: 1234,
            comment: 'Alert comment',
            dateCreated: '2022-04-25T09:35:34.489Z',
            expired: false,
            offenderNo: prisonerNumber,
          },
        ],
      }
      const results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] } = {
        totalPages: 1,
        totalElements: 1,
        content: [prisoner],
      }
      cy.task('stubGetPrisoners', results)
      cy.signIn()
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage
        .bookAVisitLink()
        .invoke('attr', 'href')
        .then(href => {
          cy.visit(href)

          const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
          searchForAPrisonerPage.searchInput().clear().type(prisonerNumber)
          searchForAPrisonerPage.searchButton().click()

          const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
          searchForAPrisonerResultsPage.resultRows().should('have.length', results.content.length)
          searchForAPrisonerResultsPage
            .firstResultLink()
            .invoke('text')
            .then(text => {
              const visitBalances: VisitBalances = {
                latestIepAdjustDate: '2022-04-25T09:35:34.489Z',
                latestPrivIepAdjustDate: '2022-04-25T09:35:34.489Z',
                remainingPvo: 1,
                remainingVo: 2,
              }
              const upcomingVisits = [
                {
                  reference: 'ab-cd-ef-gh',
                  prisonerId: 'A1234BC',
                  prisonId: 'HEI',
                  visitRoom: 'A1 L3',
                  visitType: 'SOCIAL',
                  visitStatus: 'RESERVED',
                  visitRestriction: 'OPEN',
                  startTimestamp: '2022-04-25T09:35:34.489Z',
                  endTimestamp: '',
                  visitors: [
                    {
                      nomisPersonId: 1234,
                    },
                  ],
                  visitorSupport: [
                    {
                      type: 'OTHER',
                      text: 'custom support details',
                    },
                  ],
                },
                {
                  reference: 'ab-cd-ef-gh',
                  prisonerId: 'A1234BC',
                  prisonId: 'HEI',
                  visitRoom: 'A1 L3',
                  visitType: 'SOCIAL',
                  visitStatus: 'RESERVED',
                  visitRestriction: 'OPEN',
                  startTimestamp: '2022-04-25T09:35:34.489Z',
                  endTimestamp: '',
                  visitors: [
                    {
                      nomisPersonId: 1234,
                    },
                  ],
                  visitorSupport: [
                    {
                      type: 'OTHER',
                      text: 'custom support details',
                    },
                  ],
                },
              ]
              cy.task('stubGetBookings', prisonerNumber)
              cy.task('stubGetOffender', offender)
              cy.task('stubGetVisitBalances', { offenderNo: prisonerNumber, visitBalances })
              cy.task('stubGetUpcomingVisits', { offenderNo: prisonerNumber, upcomingVisits })
              cy.task('stubGetPastVisits', prisonerNumber)
              cy.task('stubGetPrisonerSocialContacts', prisonerNumber)
              searchForAPrisonerResultsPage.firstResultLink().click()

              const prisonerProfilePage = new PrisonerProfilePage(text)

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
              prisonerProfilePage.visitTabPVORemaining().contains(visitBalances.remainingPvo)
              prisonerProfilePage
                .visitTabPVOLastAdjustment()
                .contains(prisonerDatePretty({ dateToFormat: visitBalances.latestPrivIepAdjustDate }))

              // NOTE: Need to test next dates, move next calc into function in separate PR to use in here

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
            })
        })
    })
  })
})
