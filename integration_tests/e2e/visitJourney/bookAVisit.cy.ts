import { addDays, eachDayOfInterval, format, sub } from 'date-fns'
import HomePage from '../../pages/home'
import Page from '../../pages/page'
import SearchForAPrisonerPage from '../../pages/search/searchForAPrisoner'
import SearchForAPrisonerResultsPage from '../../pages/search/searchForAPrisonerResults'
import PrisonerProfilePage from '../../pages/prisoner/prisonerProfile'
import SelectVisitorsPage from '../../pages/visitJourney/selectVisitors'
import TestData from '../../../server/routes/testutils/testData'
import { SessionsAndScheduleDto } from '../../../server/data/orchestrationApiTypes'
import AdditionalSupportPage from '../../pages/visitJourney/additionalSupport'
import MainContactPage from '../../pages/visitJourney/mainContact'
import CheckYourBookingPage from '../../pages/visitJourney/checkYourBooking'
import ConfirmationPage from '../../pages/visitJourney/confirmation'
import SelectVisitTypePage from '../../pages/visitJourney/visitType'
import SelectVisitDateAndTime from '../../pages/visitJourney/selectVisitDateAndTime'
import RequestMethodPage from '../../pages/visitJourney/requestMethod'

context('Book a visit', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  const today = new Date()
  const adultDob = format(sub(today, { years: 18 }), shortDateFormat)
  const childDob = format(sub(today, { years: 5 }), shortDateFormat)
  const contacts = [
    TestData.contact({ dateOfBirth: adultDob, restrictions: [TestData.restriction()] }),
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
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should complete the book a visit journey', () => {
    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner

    // generate array of dates over next month and add some visit sessions and events
    const dateIn7Days = format(addDays(today, 7), shortDateFormat)
    const eachDateUntilNextMonth = eachDayOfInterval({ start: today, end: addDays(today, 32) })

    const sessionsAndSchedule: SessionsAndScheduleDto[] = eachDateUntilNextMonth.map(date => {
      return {
        date: format(date, shortDateFormat),
        visitSessions: [],
        scheduledEvents: [],
      }
    })
    sessionsAndSchedule.at(7).visitSessions = [TestData.visitSessionV2({ startTime: '10:00', endTime: '11:00' })]
    sessionsAndSchedule.at(7).scheduledEvents = [
      TestData.prisonerScheduledEvent({ startTime: '09:30', endTime: '10:30' }),
    ]
    sessionsAndSchedule.at(32).visitSessions = [TestData.visitSessionV2({ startTime: '09:30', endTime: '10:00' })]
    sessionsAndSchedule.at(32).scheduledEvents = [
      TestData.prisonerScheduledEvent({ startTime: '10:30', endTime: '11:30' }),
    ]
    const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({ sessionsAndSchedule })
    const sessionIn7DaysStartTimestamp = `${sessionsAndSchedule.at(7).date}T${sessionsAndSchedule.at(7).visitSessions[0].startTime}:00`
    const sessionIn7DaysEndTimestamp = `${sessionsAndSchedule.at(7).date}T${sessionsAndSchedule.at(7).visitSessions[0].endTime}:00`
    const sessionIn7DaysTemplateReference = sessionsAndSchedule.at(7).visitSessions[0].sessionTemplateReference

    // Home page - start booking journey
    const homePage = Page.verifyOnPage(HomePage)
    homePage.bookOrChangeVisitTile().click()

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

    const prisonerRestrictions = [TestData.offenderRestriction()]
    const profile = TestData.prisonerProfile({
      alerts: [
        {
          alertType: 'U',
          alertTypeDescription: 'COVID unit management',
          alertCode: 'UPIU',
          alertCodeDescription: 'Protective Isolation Unit',
          comment: 'Alert comment \n This part is hidden by default',
          startDate: '2023-01-02',
          expiryDate: undefined,
          active: true,
        },
      ],
      prisonerRestrictions,
    })

    // Prisoner profile page
    cy.task('stubPrisonerProfile', profile)
    searchForAPrisonerResultsPage.firstResultLink().contains('Smith, John').click()
    const prisonerProfilePage = Page.verifyOnPage(PrisonerProfilePage, { title: 'Smith, John' })

    // Select visitors
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    prisonerProfilePage.bookAVisitButton().click()
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getPrisonerRestrictionType(1).contains(prisonerRestrictions[0].restrictionTypeDescription)
    selectVisitorsPage.getPrisonerRestrictionComment(1).contains(prisonerRestrictions[0].comment)
    selectVisitorsPage.getPrisonerRestrictionEndDate(1).contains('No end date')
    selectVisitorsPage.getPrisonerAlertType(1).contains('Protective Isolation Unit')

    selectVisitorsPage.getPrisonerAlertComment(1).contains('Alert comment')
    selectVisitorsPage.showFullCommentLink().contains('See full comment')
    selectVisitorsPage.showFullCommentLink().click()
    selectVisitorsPage.getPrisonerAlertComment(1).contains('This part is hidden by default')
    selectVisitorsPage.closeFullCommentLink().contains('Close full comment')
    selectVisitorsPage.closeFullCommentLink().click()
    selectVisitorsPage.getPrisonerAlertComment(1).contains('Alert comment')

    selectVisitorsPage.getPrisonerAlertEndDate(1).contains('No end date')
    selectVisitorsPage.getVisitorRestrictions(contacts[0].personId).within(() => {
      cy.contains(contacts[0].restrictions[0].restrictionTypeDescription)
      cy.contains('End date not entered')
    })
    selectVisitorsPage.getVisitor(contacts[0].personId).check()
    selectVisitorsPage.getVisitor(contacts[1].personId).check()

    // Select date and time
    cy.task('stubGetVisitSessionsAndSchedule', { prisonerId: offenderNo, visitSessionsAndSchedule })
    cy.task(
      'stubCreateVisitApplication',
      TestData.application({
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitors: [{ nomisPersonId: contacts[0].personId }, { nomisPersonId: contacts[1].personId }],
      }),
    )

    selectVisitorsPage.continueButton().click()
    const selectVisitDateAndTime = Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.selectSession(dateIn7Days, 0)

    // Additional support
    selectVisitDateAndTime.clickContinueButton()
    const additionalSupportPage = Page.verifyOnPage(AdditionalSupportPage)
    additionalSupportPage.additionalSupportRequired().check()
    additionalSupportPage.enterSupportDetails('Wheelchair ramp, Some extra help!')

    // Main contact
    additionalSupportPage.continueButton().click()
    const mainContactPage = Page.verifyOnPage(MainContactPage)
    mainContactPage.getFirstContact().check()
    mainContactPage.phoneNumberTrueRadio().click()
    mainContactPage.enterPhoneNumber('01234 567890')
    cy.task(
      'stubChangeVisitApplication',
      TestData.application({
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp, Some extra help!' },
        sessionTemplateReference: sessionIn7DaysTemplateReference,
      }),
    )

    // Request method
    mainContactPage.continueButton().click()
    const requestMethodPage = Page.verifyOnPage(RequestMethodPage)
    requestMethodPage.getRequestLabelByValue('PHONE').contains('Phone call')
    requestMethodPage.getRequestMethodByValue('PHONE').check()
    requestMethodPage.continueButton().click()

    // Check booking details
    const checkYourBookingPage = Page.verifyOnPage(CheckYourBookingPage)
    checkYourBookingPage.prisonerName().contains('John Smith')
    checkYourBookingPage.visitDate().contains(format(dateIn7Days, longDateFormat))
    checkYourBookingPage.visitTime().contains('10am to 11am')
    checkYourBookingPage.visitType().contains('Open')
    checkYourBookingPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    checkYourBookingPage.visitorName(2).contains('Bob Smith (son of the prisoner)')
    checkYourBookingPage.additionalSupport().contains('Wheelchair ramp, Some extra help!')
    checkYourBookingPage.mainContactName().contains('Jeanette Smith (wife of the prisoner)')
    checkYourBookingPage.mainContactNumber().contains('01234 567890')
    checkYourBookingPage.requestMethod().contains('Phone call')

    // Confirmation
    cy.task('stubBookVisit', {
      visit: TestData.visit({
        visitStatus: 'BOOKED',
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp, Some extra help!' },
      }),
      applicationMethod: 'PHONE',
      username: 'USER1',
      visitorDetails: [
        { visitorId: 4321, visitorAge: 18 },
        { visitorId: 4322, visitorAge: 5 },
      ],
    })

    checkYourBookingPage.submitBooking()
    const confirmationPage = Page.verifyOnPage(ConfirmationPage, { title: 'Booking confirmed' })
    confirmationPage.bookingReference().contains(TestData.visit().reference)
    confirmationPage.prisonerName().contains('John Smith')
    confirmationPage.prisonerNumber().contains(offenderNo)
    confirmationPage.visitDate().contains(format(dateIn7Days, longDateFormat))
    confirmationPage.visitTime().contains('10am to 11am')
    confirmationPage.visitType().contains('Open')
    confirmationPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.visitorName(2).contains('Bob Smith (son of the prisoner)')
    confirmationPage.additionalSupport().contains('Wheelchair ramp, Some extra help!')
    confirmationPage.mainContactName().contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.mainContactNumber().contains('01234 567890')
    confirmationPage.viewPrisonersProfileButton(offenderNo)
  })

  it('should allow VO balance override', () => {
    const prisonerDisplayName = 'Smith, John'
    const profile = TestData.prisonerProfile()
    profile.visitBalances.remainingVo = 0
    profile.visitBalances.remainingPvo = 0
    const { prisonerId } = profile

    // Prisoner profile page
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerId, contacts: [] })
    cy.task('stubPrisonerProfile', profile)

    cy.visit(`/prisoner/${prisonerId}`)

    const prisonerProfilePage = Page.verifyOnPage(PrisonerProfilePage, { title: prisonerDisplayName })

    prisonerProfilePage.bookAVisitButton().should('be.disabled')
    prisonerProfilePage
      .voOverrideText()
      .contains('The prisoner has no available visiting orders. Select the box if a booking can still be made.')
    prisonerProfilePage.voOverrideButton().click()

    prisonerProfilePage.bookAVisitButton().click()
    Page.verifyOnPage(SelectVisitorsPage)
  })

  it('should prompt for visit type selection for prisoner with closed restriction', () => {
    const prisonerDisplayName = 'Smith, John'
    const prisonerRestrictions = [
      TestData.offenderRestriction({
        restrictionType: 'CLOSED',
        restrictionTypeDescription: 'Closed',
        startDate: '2022-01-03',
      }),
    ]
    const profile = TestData.prisonerProfile({ prisonerRestrictions })
    const { prisonerId } = profile

    // Prisoner profile page
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerId, contacts })
    cy.task('stubPrisonerProfile', profile)

    cy.visit(`/prisoner/${prisonerId}`)

    const prisonerProfilePage = Page.verifyOnPage(PrisonerProfilePage, { title: prisonerDisplayName })
    prisonerProfilePage.bookAVisitButton().click()

    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getVisitor(contacts[0].personId).check()
    selectVisitorsPage.getVisitor(contacts[1].personId).check()
    selectVisitorsPage.continueButton().click()

    const selectVisitTypePage = Page.verifyOnPage(SelectVisitTypePage)
    selectVisitTypePage.getPrisonerRestrictionType(1).contains('Closed')
    selectVisitTypePage.selectClosedVisitType()

    cy.task('stubGetVisitSessionsAndSchedule', { prisonerId })

    selectVisitTypePage.submitButton().click()

    const selectVisitDateAndTime = Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.visitRestriction().contains('Closed')
  })
})
