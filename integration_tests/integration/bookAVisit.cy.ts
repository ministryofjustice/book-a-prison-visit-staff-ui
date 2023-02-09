import { addDays, format, sub } from 'date-fns'
import HomePage from '../pages/home'
import Page from '../pages/page'
import SearchForAPrisonerPage from '../pages/searchForAPrisoner'
import SearchForAPrisonerResultsPage from '../pages/searchForAPrisonerResults'
import PrisonerProfilePage from '../pages/prisonerProfile'
import SelectVisitorsPage from '../pages/selectVisitors'
import TestData from '../../server/routes/testutils/testData'
import SelectVisitDateAndTime from '../pages/selectVisitDateAndTime'
import { VisitSession } from '../../server/data/visitSchedulerApiTypes'
import AdditionalSupportPage from '../pages/additionalSupport'
import MainContactPage from '../pages/mainContact'
import CheckYourBookingPage from '../pages/checkYourBooking'
import ConfirmationPage from '../pages/confirmation'

context('Book a visit', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisons')
    cy.signIn()
  })

  it('should complete the book a visit journey', () => {
    const today = new Date()
    const prisoner = TestData.prisoner()
    const { prisonId, prisonerNumber: offenderNo } = prisoner
    const prisonerDisplayName = 'Smith, John'

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

    // Prisoner profile page
    cy.task('stubBookings', TestData.prisonerBookingSummary())
    cy.task('stubOffender', TestData.inmateDetail())
    cy.task('stubPrisonerById', prisoner)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubPastVisits', { offenderNo, pastVisits: [] })
    cy.task('stubUpcomingVisits', { offenderNo, upcomingVisits: [] })
    cy.task('stubVisitBalances', { offenderNo, visitBalances: TestData.visitBalances() })

    searchForAPrisonerResultsPage.firstResultLink().contains(prisonerDisplayName).click()
    const prisonerProfilePage = new PrisonerProfilePage(prisonerDisplayName)
    prisonerProfilePage.checkOnPage()

    // Select visitors
    cy.task('stubOffenderRestrictions', { offenderNo, offenderRestrictions: [TestData.offenderRestriction()] })
    prisonerProfilePage.bookAVisitButton().click()
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
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
    selectVisitDateAndTime.getFirstSlot().check()

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
      }),
    )
    cy.task(
      'stubBookVisit',
      TestData.visit({
        visitStatus: 'BOOKED',
        startTimestamp: visitSessions[0].startTimestamp,
        endTimestamp: visitSessions[0].endTimestamp,
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'OTHER', text: 'Some extra help!' }],
      }),
    )

    checkYourBookingPage.bookButton().click()
    const confirmationPage = Page.verifyOnPage(ConfirmationPage)
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
})