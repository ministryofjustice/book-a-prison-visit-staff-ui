import { addDays, format, sub } from 'date-fns'
import HomePage from '../pages/home'
import Page from '../pages/page'
import SearchForAPrisonerPage from '../pages/searchForAPrisoner'
import SearchForAPrisonerResultsPage from '../pages/searchForAPrisonerResults'
import PrisonerProfilePage from '../pages/prisonerProfile'
import SelectVisitorsPage from '../pages/selectVisitors'
import TestData from '../../server/routes/testutils/testData'
import { VisitSession } from '../../server/data/orchestrationApiTypes'
import AdditionalSupportPage from '../pages/additionalSupport'
import MainContactPage from '../pages/mainContact'
import CheckYourBookingPage from '../pages/checkYourBooking'
import ConfirmationPage from '../pages/confirmation'
import SelectVisitTypePage from '../pages/visitType'
import SelectVisitDateAndTime from '../pages/selectVisitDateAndTime'

context('Book a visit', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const mediumDateFormat = 'd MMMM yyyy'
  const longDateFormat = 'EEEE d MMMM yyyy'

  const today = new Date()
  const childDob = format(sub(today, { years: 5 }), shortDateFormat)
  const contacts = [
    TestData.contact({ restrictions: [TestData.restriction()] }),
    TestData.contact({
      personId: 4322,
      firstName: 'Bob',
      dateOfBirth: childDob,
      relationshipCode: 'SON',
      relationshipDescription: 'Son',
    }),
  ]

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisons')
    cy.signIn()
  })

  it('should complete the book a visit journey', () => {
    const prisoner = TestData.prisoner()
    const { prisonId, prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'Smith, John'

    const visitSessions: VisitSession[] = [
      TestData.visitSession({
        startTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'10:00:00`),
        endTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'11:00:00`),
      }),
      TestData.visitSession({
        startTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'13:30:00`),
        endTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'15:00:00`),
      }),
      TestData.visitSession({
        startTimestamp: format(addDays(today, 32), `${shortDateFormat}'T'09:30:00`), // session in the following month
        endTimestamp: format(addDays(today, 32), `${shortDateFormat}'T'10:00:00`),
      }),
    ]

    const scheduledEvents = [
      TestData.scheduledEvent({
        startTime: format(addDays(today, 7), `${shortDateFormat}'T'09:30:00`),
        endTime: format(addDays(today, 7), `${shortDateFormat}'T'10:30:00`),
      }),
      TestData.scheduledEvent({
        startTime: format(addDays(today, 32), `${shortDateFormat}'T'10:30:00`),
        endTime: format(addDays(today, 32), `${shortDateFormat}'T'11:30:00`),
      }),
    ]

    // Home page - start booking journey
    const homePage = Page.verifyOnPage(HomePage)
    homePage.bookAVisitTile().click()

    // Search for prisoner
    cy.task('stubPrisoners', {
      term: offenderNo,
      results: {
        totalElements: 1,
        totalPages: 1,
        content: [prisoner],
      },
    })
    const searchForAPrisonerPage = Page.verifyOnPage(SearchForAPrisonerPage)
    searchForAPrisonerPage.searchInput().type(offenderNo)

    // Search results page
    searchForAPrisonerPage.searchButton().click()
    const searchForAPrisonerResultsPage = Page.verifyOnPage(SearchForAPrisonerResultsPage)
    searchForAPrisonerResultsPage.resultRows().should('have.length', 1)

    const profile = TestData.prisonerProfile()

    const { prisonerId } = profile
    // Prisoner profile page
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubPrisonerProfile', { prisonId, prisonerId, profile })

    searchForAPrisonerResultsPage.firstResultLink().contains(prisonerDisplayName).click()
    const prisonerProfilePage = Page.verifyOnPageTitle(PrisonerProfilePage, prisonerDisplayName)

    // Select visitors
    const offenderRestrictions = [TestData.offenderRestriction()]
    cy.task('stubOffenderRestrictions', { offenderNo, offenderRestrictions })
    prisonerProfilePage.bookAVisitButton().click()
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getPrisonerRestrictionType(1).contains(offenderRestrictions[0].restrictionTypeDescription)
    selectVisitorsPage.getPrisonerRestrictionComment(1).contains(offenderRestrictions[0].comment)
    selectVisitorsPage
      .getPrisonerRestrictionStartDate(1)
      .contains(format(new Date(offenderRestrictions[0].startDate), mediumDateFormat))
    selectVisitorsPage.getPrisonerRestrictionEndDate(1).contains('Not entered')
    selectVisitorsPage.getVisitorRestrictions(contacts[0].personId).within(() => {
      cy.contains(contacts[0].restrictions[0].restrictionTypeDescription)
      cy.contains('End date not entered')
    })
    selectVisitorsPage.getVisitor(contacts[0].personId).check()
    selectVisitorsPage.getVisitor(contacts[1].personId).check()

    // Select date and time
    cy.task('stubVisitSessions', {
      offenderNo,
      prisonId,
      visitSessions,
    })
    cy.task('stubOffenderEvents', {
      offenderNo,
      fromDate: format(today, shortDateFormat),
      toDate: format(addDays(today, 32), shortDateFormat),
      scheduledEvents,
    })
    cy.task(
      'stubReserveVisit',
      TestData.visit({
        visitStatus: 'RESERVED',
        startTimestamp: visitSessions[0].startTimestamp,
        endTimestamp: visitSessions[0].endTimestamp,
        visitors: [{ nomisPersonId: contacts[0].personId }, { nomisPersonId: contacts[1].personId }],
      }),
    )

    selectVisitorsPage.continueButton().click()
    const selectVisitDateAndTime = Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.expandAllSections()
    selectVisitDateAndTime.getSlotById(1).check()

    // Additional support
    cy.task('stubAvailableSupport')
    selectVisitDateAndTime.continueButton().click()
    const additionalSupportPage = Page.verifyOnPage(AdditionalSupportPage)
    additionalSupportPage.additionalSupportRequired().check()
    additionalSupportPage.selectSupportType('WHEELCHAIR')
    additionalSupportPage.selectSupportType('OTHER')
    additionalSupportPage.enterOtherSupportDetails('Some extra help!')

    // Main contact
    additionalSupportPage.continueButton().click()
    const mainContactPage = Page.verifyOnPage(MainContactPage)
    mainContactPage.getFirstContact().check()
    mainContactPage.enterPhoneNumber('01234 567890')

    // Check booking details
    mainContactPage.continueButton().click()
    const checkYourBookingPage = Page.verifyOnPage(CheckYourBookingPage)
    checkYourBookingPage.prisonerName().contains(prisonerDisplayName)
    checkYourBookingPage.visitDate().contains(format(new Date(visitSessions[0].startTimestamp), longDateFormat))
    checkYourBookingPage.visitTime().contains('10am to 11am')
    checkYourBookingPage.visitType().contains('Open')
    checkYourBookingPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    checkYourBookingPage.visitorName(2).contains('Bob Smith (son of the prisoner)')
    checkYourBookingPage.additionalSupport().contains('Wheelchair ramp, Some extra help!')
    checkYourBookingPage.mainContactName().contains('Jeanette Smith (wife of the prisoner)')
    checkYourBookingPage.mainContactNumber().contains('01234 567890')

    // Confirmation
    cy.task(
      'stubChangeReservedSlot',
      TestData.visit({
        visitStatus: 'RESERVED',
        startTimestamp: visitSessions[0].startTimestamp,
        endTimestamp: visitSessions[0].endTimestamp,
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'OTHER', text: 'Some extra help!' }],
        sessionTemplateReference: visitSessions[0].sessionTemplateReference,
      }),
    )
    cy.task('stubBookVisit', {
      visit: TestData.visit({
        visitStatus: 'BOOKED',
        startTimestamp: visitSessions[0].startTimestamp,
        endTimestamp: visitSessions[0].endTimestamp,
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'OTHER', text: 'Some extra help!' }],
      }),
      applicationMethod: 'NOT_KNOWN',
    })

    checkYourBookingPage.bookButton().click()
    const confirmationPage = Page.verifyOnPageTitle(ConfirmationPage, 'Booking confirmed')
    confirmationPage.bookingReference().contains(TestData.visit().reference)
    confirmationPage.prisonerName().contains(prisonerDisplayName)
    confirmationPage.prisonerNumber().contains(offenderNo)
    confirmationPage.visitDate().contains(format(new Date(visitSessions[0].startTimestamp), longDateFormat))
    confirmationPage.visitTime().contains('10am to 11am')
    confirmationPage.visitType().contains('Open')
    confirmationPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.visitorName(2).contains('Bob Smith (son of the prisoner)')
    confirmationPage.additionalSupport().contains('Wheelchair ramp, Some extra help!')
    confirmationPage.mainContactName().contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.mainContactNumber().contains('01234 567890')
    confirmationPage.bookAnotherVisitButton(offenderNo)
  })

  it('should allow VO balance override', () => {
    const prisonerDisplayName = 'Smith, John'
    const profile = TestData.prisonerProfile({
      visitBalances: {
        remainingVo: 0,
        remainingPvo: 0,
        latestIepAdjustDate: '2021-04-21',
        latestPrivIepAdjustDate: '2021-12-01',
      },
    })
    const { prisonerId, prisonId } = profile

    // Prisoner profile page
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerId, contacts: [] })
    cy.task('stubPrisonerProfile', { prisonId, prisonerId, profile })

    cy.visit(`/prisoner/${prisonerId}`)

    const prisonerProfilePage = Page.verifyOnPageTitle(PrisonerProfilePage, prisonerDisplayName)

    prisonerProfilePage.bookAVisitButton().should('be.disabled')
    prisonerProfilePage
      .voOverrideText()
      .contains('The prisoner has no available visiting orders. Select the box if a booking can still be made.')
    prisonerProfilePage.voOverrideButton().click()

    const offenderRestrictions = [TestData.offenderRestriction()]
    cy.task('stubOffenderRestrictions', { offenderNo: prisonerId, offenderRestrictions })
    prisonerProfilePage.bookAVisitButton().click()
    Page.verifyOnPage(SelectVisitorsPage)
  })

  it('should prompt for visit type selection for prisoner with closed restriction', () => {
    const prisonerDisplayName = 'Smith, John'
    const profile = TestData.prisonerProfile({})
    const { prisonerId, prisonId } = profile

    // Prisoner profile page
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerId, contacts })
    cy.task('stubPrisonerProfile', { prisonId, prisonerId, profile })

    cy.visit(`/prisoner/${prisonerId}`)

    const prisonerProfilePage = Page.verifyOnPageTitle(PrisonerProfilePage, prisonerDisplayName)

    const offenderRestrictions = [
      TestData.offenderRestriction({
        restrictionType: 'CLOSED',
        restrictionTypeDescription: 'Closed',
        startDate: '2022-01-03',
      }),
    ]
    cy.task('stubOffenderRestrictions', { offenderNo: prisonerId, offenderRestrictions })
    prisonerProfilePage.bookAVisitButton().click()

    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getVisitor(contacts[0].personId).check()
    selectVisitorsPage.getVisitor(contacts[1].personId).check()
    selectVisitorsPage.continueButton().click()

    const selectVisitTypePage = Page.verifyOnPage(SelectVisitTypePage)
    selectVisitTypePage.getPrisonerRestrictionType(1).contains('Closed')
    selectVisitTypePage.selectClosedVisitType()

    cy.task('stubVisitSessions', {
      offenderNo: prisonerId,
      prisonId,
      visitSessions: [],
    })
    cy.task('stubOffenderEvents', {
      offenderNo: prisonerId,
      fromDate: format(today, shortDateFormat),
      toDate: format(today, shortDateFormat),
      scheduledEvents: [],
    })

    selectVisitTypePage.submitButton().click()

    const selectVisitDateAndTime = Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.visitRestriction().contains('Closed')
  })
})
