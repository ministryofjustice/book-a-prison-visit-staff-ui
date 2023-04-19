import { format } from 'date-fns'
import PrisonerProfilePage from '../pages/prisonerProfile'
import Page from '../pages/page'
import { PrisonerProfile } from '../../server/data/orchestrationApiTypes'

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

    const profile = <PrisonerProfile>{
      prisonerId: 'A1234BC',
      firstName: 'JOHN',
      lastName: 'SMITH',
      dateOfBirth: '1975-04-02',
      cellLocation: '1-1-C-028',
      prisonName: 'Hewell (HMP)',
      category: 'Cat C',
      convictedStatus: 'Convicted',
      incentiveLevel: 'Standard',
      alerts: [
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
      ],
      visitBalances: {
        remainingVo: 1,
        remainingPvo: 2,
        latestIepAdjustDate: '2023-01-01',
        latestPrivIepAdjustDate: '2023-02-01',
      },
      visits: [
        {
          applicationReference: 'aaa-bbb-ccc',
          reference: 'ab-cd-ef-gh',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          visitRoom: 'A1 L3',
          visitType: 'SOCIAL',
          visitStatus: 'BOOKED',
          visitRestriction: 'OPEN',
          startTimestamp: '2022-08-17T10:00:00',
          endTimestamp: '2022-08-17T11:00:00',
          visitNotes: [],
          visitContact: {
            name: 'Mary Smith',
            telephone: '01234 555444',
          },
          visitors: [
            {
              nomisPersonId: 1234,
            },
          ],
          visitorSupport: [],
          createdBy: 'user1',
          createdTimestamp: '',
          modifiedTimestamp: '',
        },
      ],
    }
    const { prisonerId } = profile
    const prisonId = 'HEI'
    // Prisoner profile page
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
    prisonerProfilePage.visitTabVOLastAdjustment().contains('1 January 2023')
    // prisonerProfilePage.visitTabVONextAdjustment().contains('15 January 2023') // in 14 days' time
    prisonerProfilePage.visitTabPVORemaining().contains(2)
    prisonerProfilePage.visitTabPVOLastAdjustment().contains('1 February 2023')
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

    // Visits history tab
    prisonerProfilePage.selectVisitsTab()
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
      .contains('10:00am - 11:00am')
    prisonerProfilePage.visitTabVisitors().eq(0).contains('Mary Smith')
    prisonerProfilePage.visitTabVisitStatus().eq(0).contains('Booked')
  })
})
