import { addDays, format, sub } from 'date-fns'
import PrisonerProfilePage from '../pages/prisonerProfile'
import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'

context('Prisoner profile page', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const prettyDateFormat = 'd MMMM yyyy'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisons')
    cy.signIn()
  })

  it('should show the prisoner profile page', () => {
    const today = new Date()
    const prisoner = TestData.prisoner()
    const inmateDetail = TestData.inmateDetail({ activeAlertCount: 2, alerts: [TestData.alert()] })
    const prisonerBookingSummary = TestData.prisonerBookingSummary()
    const prisonerDisplayName = 'Smith, John'
    const visitBalances = TestData.visitBalances({
      latestIepAdjustDate: '2023-01-01',
      latestPrivIepAdjustDate: '2023-02-01',
    })

    const childDob = format(sub(today, { years: 5 }), shortDateFormat)
    const contacts = [
      TestData.contact(),
      TestData.contact({
        personId: 4322,
        firstName: 'Bob',
        dateOfBirth: childDob,
        relationshipCode: 'SON',
        relationshipDescription: 'Son',
      }),
    ]

    const pastVisit = TestData.visit()
    const upcomingVisit = TestData.visit({
      reference: 'bc-de-fg-hi',
      startTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'13:30:00`),
      endTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'14:30:00`),
    })

    cy.task('stubBookings', prisonerBookingSummary)
    cy.task('stubOffender', inmateDetail)
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisoner.prisonerNumber, contacts })
    cy.task('stubPastVisits', { offenderNo: prisoner.prisonerNumber, pastVisits: [pastVisit] })
    cy.task('stubUpcomingVisits', { offenderNo: prisoner.prisonerNumber, upcomingVisits: [upcomingVisit] })
    cy.task('stubVisitBalances', { offenderNo: prisoner.prisonerNumber, visitBalances })

    // Go to prisoner profile page
    cy.visit(`/prisoner/${prisoner.prisonerNumber}`)
    const prisonerProfilePage = Page.verifyOnPageTitle(PrisonerProfilePage, prisonerDisplayName)

    // Prisoner details
    prisonerProfilePage.flaggedAlerts().eq(0).contains(inmateDetail.alerts[0].alertCodeDescription)
    prisonerProfilePage.prisonNumber().contains(prisoner.prisonerNumber)
    prisonerProfilePage.dateOfBirth().contains(format(new Date(prisoner.dateOfBirth), prettyDateFormat))
    prisonerProfilePage
      .location()
      .contains(`${inmateDetail.assignedLivingUnit.description}, ${inmateDetail.assignedLivingUnit.agencyName}`)
    prisonerProfilePage.category().contains(inmateDetail.category)
    prisonerProfilePage.incentiveLevel().contains(prisoner.currentIncentive.level.description)
    prisonerProfilePage.convictionStatus().contains(prisonerBookingSummary.convictedStatus)
    prisonerProfilePage.alertCount().contains(inmateDetail.activeAlertCount)
    prisonerProfilePage.remainingVOs().contains(visitBalances.remainingVo)
    prisonerProfilePage.remainingPVOs().contains(visitBalances.remainingPvo)

    // Visiting orders tab
    prisonerProfilePage.selectVisitingOrdersTab()
    prisonerProfilePage.visitTabVORemaining().contains(visitBalances.remainingVo)
    prisonerProfilePage.visitTabVOLastAdjustment().contains('1 January 2023')
    prisonerProfilePage.visitTabVONextAdjustment().contains('15 January 2023') // in 14 days' time
    prisonerProfilePage.visitTabPVORemaining().contains(visitBalances.remainingPvo)
    prisonerProfilePage.visitTabPVOLastAdjustment().contains('1 February 2023')
    prisonerProfilePage.visitTabPVONextAdjustment().contains('1 March 2023') // 1st of following month

    // Active alerts tab
    prisonerProfilePage.selectActiveAlertsTab()
    prisonerProfilePage.alertsTabType().eq(0).contains(inmateDetail.alerts[0].alertTypeDescription)
    prisonerProfilePage.alertsTabCode().eq(0).contains(inmateDetail.alerts[0].alertCodeDescription)
    prisonerProfilePage.alertsTabComment().eq(0).contains(inmateDetail.alerts[0].comment)
    prisonerProfilePage
      .alertsTabCreated()
      .eq(0)
      .contains(format(new Date(inmateDetail.alerts[0].dateCreated), prettyDateFormat))
    prisonerProfilePage.alertsTabExpires().eq(0).contains('Not entered')

    // Upcoming visits tab
    prisonerProfilePage.selectUpcomingVisitsTab()
    prisonerProfilePage
      .upcomingTabReference()
      .eq(0)
      .contains(upcomingVisit.reference)
      .should('have.attr', 'href', `/visit/${upcomingVisit.reference}`)
    prisonerProfilePage.upcomingTabType().eq(0).contains('Social')
    prisonerProfilePage.upcomingTabLocation().eq(0).contains('Hewell (HMP)')
    prisonerProfilePage
      .upcomingTabDateAndTime()
      .eq(0)
      .contains(format(new Date(upcomingVisit.startTimestamp), prettyDateFormat))
      .contains('1:30pm - 2:30pm')
    prisonerProfilePage.upcomingTabVisitors().eq(0).contains('Jeanette Smith').contains('Bob Smith')
    prisonerProfilePage.upcomingTabVisitStatus().eq(0).contains('Booked')

    // Visits history tab
    prisonerProfilePage.selectVisitsHistoryTab()
    prisonerProfilePage
      .pastTabReference()
      .eq(0)
      .contains(pastVisit.reference)
      .should('have.attr', 'href', `/visit/${pastVisit.reference}`)
    prisonerProfilePage.pastTabType().eq(0).contains('Social')
    prisonerProfilePage.pastTabLocation().eq(0).contains('Hewell (HMP)')
    prisonerProfilePage
      .pastTabDateAndTime()
      .eq(0)
      .contains(format(new Date(pastVisit.startTimestamp), prettyDateFormat))
      .contains('10:00am - 11:00am')
    prisonerProfilePage.pastTabVisitors().eq(0).contains('Jeanette Smith').contains('Bob Smith')
    prisonerProfilePage.pastTabVisitStatus().eq(0).contains('Booked')
  })
})
