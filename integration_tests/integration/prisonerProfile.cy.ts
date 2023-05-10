import { format } from 'date-fns'
import PrisonerProfilePage from '../pages/prisonerProfile'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'

context('Prisoner profile page', () => {
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
    const prisonerDisplayName = 'Smith, John'

    const alerts = [
      {
        alertType: 'U',
        alertTypeDescription: 'COVID unit management',
        alertCode: 'UPIU',
        alertCodeDescription: 'Protective Isolation Unit',
        comment: 'Test',
        dateCreated: '2022-01-02',
        expired: false,
        active: true,
      },
      {
        alertType: 'X',
        alertTypeDescription: 'Security',
        alertCode: 'XR',
        alertCodeDescription: 'Racist',
        comment: 'Test',
        dateCreated: '2022-01-01',
        expired: false,
        active: true,
      },
    ]
    const visit = TestData.visit()
    const contacts = [TestData.contact(), TestData.contact({ personId: 4322, firstName: 'Bob' })]
    const profile = TestData.prisonerProfile({ alerts, visits: [visit] })

    const { prisonerId } = profile
    const prisonId = 'HEI'

    // Prisoner profile page
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerId, contacts })
    cy.task('stubPrisonerProfile', { prisonId, prisonerId, profile })

    // Go to prisoner profile page
    cy.visit(`/prisoner/${prisonerId}`)
    const prisonerProfilePage = Page.verifyOnPageTitle(PrisonerProfilePage, prisonerDisplayName)

    // Prisoner details
    prisonerProfilePage.flaggedAlerts().eq(0).contains('Protective Isolation Unit')
    prisonerProfilePage.prisonNumber().contains(profile.prisonerId)
    prisonerProfilePage.dateOfBirth().contains(format(new Date(profile.dateOfBirth), prettyDateFormat))
    prisonerProfilePage.location().contains(`${profile.cellLocation}, ${profile.prisonName}`)
    prisonerProfilePage.category().contains(profile.category)
    prisonerProfilePage.incentiveLevel().contains(profile.incentiveLevel)
    prisonerProfilePage.convictionStatus().contains(profile.convictedStatus)
    prisonerProfilePage.alertCount().contains(2)
    prisonerProfilePage.remainingVOs().contains(1)
    prisonerProfilePage.remainingPVOs().contains(2)

    // Visiting orders tab
    prisonerProfilePage.selectVisitingOrdersTab()
    prisonerProfilePage.visitTabVORemaining().contains(1)
    prisonerProfilePage.visitTabVOLastAdjustment().contains('21 April 2021')
    // prisonerProfilePage.visitTabVONextAdjustment().contains('15 January 2023') // in 14 days' time
    prisonerProfilePage.visitTabPVORemaining().contains(2)
    prisonerProfilePage.visitTabPVOLastAdjustment().contains('1 December 2021')
    // prisonerProfilePage.visitTabPVONextAdjustment().contains('1 March 2023') // 1st of following month

    // Active alerts tab
    prisonerProfilePage.selectActiveAlertsTab()
    prisonerProfilePage.alertsTabType().eq(0).contains('COVID unit management (U)')
    prisonerProfilePage.alertsTabCode().eq(0).contains('UPIU')
    prisonerProfilePage.alertsTabComment().eq(0).contains('Test')
    prisonerProfilePage
      .alertsTabCreated()
      .eq(0)
      .contains(format(new Date('01-02-2022'), prettyDateFormat))
    prisonerProfilePage.alertsTabExpires().eq(0).contains('Not entered')

    // Visits tab
    prisonerProfilePage.selectVisitsTab()
    prisonerProfilePage.visitTabCaption(1).contains('January 2022 (1 past visit)')
    prisonerProfilePage
      .visitTabReference()
      .eq(0)
      .contains(profile.visits[0].reference)
      .should('have.attr', 'href', `/visit/${profile.visits[0].reference}`)
    prisonerProfilePage.visitTabType().eq(0).contains('Social')
    prisonerProfilePage.visitTabLocation().eq(0).contains('Hewell (HMP)')
    prisonerProfilePage
      .visitTabDateAndTime()
      .eq(0)
      .contains(format(new Date(profile.visits[0].startTimestamp), prettyDateFormat))
      .contains('10am - 11am')
    prisonerProfilePage
      .visitTabVisitors()
      .eq(0)
      .within(() => {
        cy.contains('Jeanette Smith')
        cy.contains('Bob Smith')
      })
    prisonerProfilePage.visitTabVisitStatus().eq(0).contains('Booked')
  })
})
