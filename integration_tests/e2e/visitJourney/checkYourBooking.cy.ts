import { addDays, eachDayOfInterval, format, sub } from 'date-fns'
import Page from '../../pages/page'
import PrisonerProfilePage from '../../pages/prisoner/prisonerProfile'
import SelectVisitorsPage from '../../pages/visitJourney/selectVisitors'
import TestData from '../../../server/routes/testutils/testData'
import { SessionsAndScheduleDto } from '../../../server/data/orchestrationApiTypes'
import AdditionalSupportPage from '../../pages/visitJourney/additionalSupport'
import MainContactPage from '../../pages/visitJourney/mainContact'
import CheckYourBookingPage from '../../pages/visitJourney/checkYourBooking'
import ConfirmationPage from '../../pages/visitJourney/confirmation'
import SelectVisitDateAndTime from '../../pages/visitJourney/selectVisitDateAndTime'
import RequestMethodPage from '../../pages/visitJourney/requestMethod'

context('Check visit details page', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'
  const dayMonthFormat = 'd MMMM'

  const profile = TestData.prisonerProfile()
  const { prisonerId } = profile

  const today = new Date()
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

  // generate array of dates over next month and add some visit sessions and events
  const dateIn7Days = format(addDays(today, 7), shortDateFormat)
  const dateIn8Days = format(addDays(today, 8), shortDateFormat)
  const eachDateUntilNextMonth = eachDayOfInterval({ start: today, end: addDays(today, 32) })

  const sessionsAndSchedule: SessionsAndScheduleDto[] = eachDateUntilNextMonth.map(date => {
    return {
      date: format(date, shortDateFormat),
      visitSessions: [],
      scheduledEvents: [],
    }
  })
  sessionsAndSchedule.at(7).visitSessions = [
    TestData.visitSessionV2({ startTime: '10:00', endTime: '11:00', sessionTemplateReference: 'a' }),
  ]
  sessionsAndSchedule.at(8).visitSessions = [
    TestData.visitSessionV2({ startTime: '13:30', endTime: '15:00', sessionTemplateReference: 'b' }),
  ]
  const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({ sessionsAndSchedule })
  const sessionIn7DaysStartTimestamp = `${sessionsAndSchedule.at(7).date}T${sessionsAndSchedule.at(7).visitSessions[0].startTime}:00`
  const sessionIn7DaysEndTimestamp = `${sessionsAndSchedule.at(7).date}T${sessionsAndSchedule.at(7).visitSessions[0].endTime}:00`
  const sessionIn7DaysTemplateReference = sessionsAndSchedule.at(7).visitSessions[0].sessionTemplateReference
  const sessionIn8DaysStartTimestamp = `${sessionsAndSchedule.at(8).date}T${sessionsAndSchedule.at(8).visitSessions[0].startTime}:00`
  const sessionIn8DaysEndTimestamp = `${sessionsAndSchedule.at(8).date}T${sessionsAndSchedule.at(8).visitSessions[0].endTime}:00`
  const sessionIn8DaysTemplateReference = sessionsAndSchedule.at(8).visitSessions[0].sessionTemplateReference

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should complete the book a visit journey and change details before booking', () => {
    // Start - Prisoner profile page
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerId, contacts })
    cy.task('stubPrisonerProfile', profile)
    cy.visit(`/prisoner/${prisonerId}`)

    const prisonerProfilePage = Page.verifyOnPage(PrisonerProfilePage, { title: 'Smith, John' })

    // Select visitors - first of two
    prisonerProfilePage.bookAVisitButton().click()
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getVisitor(contacts[0].personId).check()

    // Select date and time
    cy.task('stubGetVisitSessionsAndSchedule', { prisonerId, visitSessionsAndSchedule })
    cy.task(
      'stubCreateVisitApplication',
      TestData.application({
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitors: [{ nomisPersonId: contacts[0].personId }],
        sessionTemplateReference: sessionIn7DaysTemplateReference,
      }),
    )
    selectVisitorsPage.continueButton().click()
    const selectVisitDateAndTime = Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.selectSession(dateIn7Days, 0)

    // Additional support
    selectVisitDateAndTime.clickContinueButton()
    const additionalSupportPage = Page.verifyOnPage(AdditionalSupportPage)
    additionalSupportPage.additionalSupportNotRequired().check()

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
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [{ nomisPersonId: contacts[0].personId, visitContact: true }],
        visitorSupport: { description: '' },
        sessionTemplateReference: sessionIn7DaysTemplateReference,
      }),
    )

    // Request method
    mainContactPage.continueButton().click()
    const requestMethodPage = Page.verifyOnPage(RequestMethodPage)
    requestMethodPage.getRequestLabelByValue('PHONE').contains('Phone call')
    requestMethodPage.getRequestMethodByValue('PHONE').check()
    requestMethodPage.continueButton().click()

    // Check visit details
    const checkYourBookingPage = Page.verifyOnPage(CheckYourBookingPage)
    checkYourBookingPage.prisonerName().contains('John Smith')
    checkYourBookingPage.visitDate().contains(format(dateIn7Days, longDateFormat))
    checkYourBookingPage.visitTime().contains('10am to 11am')
    checkYourBookingPage.visitType().contains('Open')
    checkYourBookingPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    checkYourBookingPage.additionalSupport().contains('None')
    checkYourBookingPage.mainContactName().contains('Jeanette Smith (wife of the prisoner)')
    checkYourBookingPage.mainContactNumber().contains('01234 567890')
    checkYourBookingPage.requestMethod().contains('Phone call')

    // Check details - change visit date - then proceed through journey
    checkYourBookingPage.changeVisitDate().click()
    Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.clickCalendarDay(dateIn8Days)
    selectVisitDateAndTime.selectSession(dateIn8Days, 0)
    cy.task(
      'stubChangeVisitApplication',
      TestData.application({
        startTimestamp: sessionIn8DaysStartTimestamp,
        endTimestamp: sessionIn8DaysEndTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [{ nomisPersonId: contacts[0].personId, visitContact: true }],
        visitorSupport: { description: '' },
        sessionTemplateReference: sessionIn8DaysTemplateReference,
      }),
    )
    selectVisitDateAndTime.clickContinueButton()
    additionalSupportPage.continueButton().click()
    mainContactPage.continueButton().click()
    requestMethodPage.continueButton().click()
    checkYourBookingPage.visitDate().contains(format(dateIn8Days, longDateFormat))
    checkYourBookingPage.visitTime().contains('1:30pm to 3pm')

    // Check details - change visitors, add visitor - then proceed through journey
    checkYourBookingPage.changeVisitors().click()
    selectVisitorsPage.getVisitor(contacts[0].personId).should('be.checked')
    selectVisitorsPage.getVisitor(contacts[1].personId).should('not.be.checked')
    selectVisitorsPage.getVisitor(contacts[1].personId).check()
    selectVisitorsPage.continueButton().click()
    cy.task(
      'stubChangeVisitApplication',
      TestData.application({
        startTimestamp: sessionIn8DaysStartTimestamp,
        endTimestamp: sessionIn8DaysEndTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: '' },
        sessionTemplateReference: sessionIn8DaysTemplateReference,
      }),
    )
    selectVisitDateAndTime.clickContinueButton()
    additionalSupportPage.continueButton().click()
    mainContactPage.continueButton().click()
    requestMethodPage.continueButton().click()
    checkYourBookingPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    checkYourBookingPage.visitorName(2).contains('Bob Smith (son of the prisoner)')

    // Check details - change additional support - then proceed through journey
    checkYourBookingPage.changeAdditionalSupport().click()
    additionalSupportPage.additionalSupportNotRequired().should('be.checked')
    additionalSupportPage.additionalSupportRequired().check()
    additionalSupportPage.enterSupportDetails('Wheelchair ramp')
    additionalSupportPage.continueButton().click()
    cy.task(
      'stubChangeVisitApplication',
      TestData.application({
        startTimestamp: sessionIn8DaysStartTimestamp,
        endTimestamp: sessionIn8DaysEndTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp' },
        sessionTemplateReference: sessionIn8DaysTemplateReference,
      }),
    )
    mainContactPage.continueButton().click()
    requestMethodPage.continueButton().click()
    checkYourBookingPage.additionalSupport().contains('Wheelchair ramp')

    // Check details - change main contact number - then proceed through journey
    checkYourBookingPage.changeMainContact().click()
    mainContactPage.enterPhoneNumber('09876 543 321')
    cy.task(
      'stubChangeVisitApplication',
      TestData.application({
        startTimestamp: sessionIn8DaysStartTimestamp,
        endTimestamp: sessionIn8DaysEndTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '09876 543 321' },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp' },
        sessionTemplateReference: sessionIn8DaysTemplateReference,
      }),
    )
    mainContactPage.continueButton().click()
    requestMethodPage.continueButton().click()
    checkYourBookingPage.mainContactNumber().contains('09876 543 321')

    // Check details - change request method - then proceed through journey
    checkYourBookingPage.changeRequestMethod().click()
    requestMethodPage.getRequestLabelByValue('WEBSITE').contains('GOV.UK')
    requestMethodPage.getRequestMethodByValue('WEBSITE').check()
    requestMethodPage.continueButton().click()
    checkYourBookingPage.requestMethod().contains('GOV.UK')

    // Confirmation
    cy.task('stubBookVisit', {
      visit: TestData.visit({
        visitStatus: 'BOOKED',
        startTimestamp: sessionIn8DaysStartTimestamp,
        endTimestamp: sessionIn8DaysEndTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '09876 543 321' },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp' },
      }),
      applicationMethod: 'WEBSITE',
      username: 'USER1',
    })

    checkYourBookingPage.submitBooking()
    const confirmationPage = Page.verifyOnPage(ConfirmationPage, { title: 'Booking confirmed' })
    confirmationPage.bookingReference().contains(TestData.visit().reference)
    confirmationPage.prisonerName().contains('John Smith')
    confirmationPage.prisonerNumber().contains(prisonerId)
    confirmationPage.visitDate().contains(format(dateIn8Days, longDateFormat))
    confirmationPage.visitTime().contains('1:30pm to 3pm')
    confirmationPage.visitType().contains('Open')
    confirmationPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.visitorName(2).contains('Bob Smith (son of the prisoner)')
    confirmationPage.additionalSupport().contains('Wheelchair ramp')
    confirmationPage.mainContactName().contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.mainContactNumber().contains('09876 543 321')
  })

  it('should display validation error message after failing to submit booking', () => {
    // Start - Prisoner profile page
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerId, contacts })
    cy.task('stubPrisonerProfile', profile)
    cy.visit(`/prisoner/${prisonerId}`)

    const prisonerProfilePage = Page.verifyOnPage(PrisonerProfilePage, { title: 'Smith, John' })

    // Select visitors - first of two
    prisonerProfilePage.bookAVisitButton().click()
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getVisitor(contacts[0].personId).check()

    // Select date and time
    cy.task('stubGetVisitSessionsAndSchedule', { prisonerId, visitSessionsAndSchedule })
    cy.task(
      'stubCreateVisitApplication',
      TestData.application({
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitors: [{ nomisPersonId: contacts[0].personId }],
        sessionTemplateReference: sessionIn7DaysTemplateReference,
      }),
    )
    selectVisitorsPage.continueButton().click()
    const selectVisitDateAndTime = Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.selectSession(dateIn7Days, 0)

    // Additional support
    selectVisitDateAndTime.clickContinueButton()
    const additionalSupportPage = Page.verifyOnPage(AdditionalSupportPage)
    additionalSupportPage.additionalSupportNotRequired().check()

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
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [{ nomisPersonId: contacts[0].personId, visitContact: true }],
        visitorSupport: { description: '' },
        sessionTemplateReference: sessionIn7DaysTemplateReference,
      }),
    )

    // Request method
    mainContactPage.continueButton().click()
    const requestMethodPage = Page.verifyOnPage(RequestMethodPage)
    requestMethodPage.getRequestLabelByValue('PHONE').contains('Phone call')
    requestMethodPage.getRequestMethodByValue('PHONE').check()
    requestMethodPage.continueButton().click()

    // Check visit details
    const checkYourBookingPage = Page.verifyOnPage(CheckYourBookingPage)
    checkYourBookingPage.prisonerName().contains('John Smith')
    checkYourBookingPage.visitDate().contains(format(dateIn7Days, longDateFormat))

    cy.task('stubBookVisitValidationFailed', {
      applicationReference: TestData.visit().applicationReference,
    })

    cy.task('stubGetVisitSessionsAndSchedule', { prisonerId })
    checkYourBookingPage.submitBooking()

    // Check alert on select date and time page
    Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime
      .getMessages()
      .eq(0)
      .contains(`John Smith now has a non-association on ${format(dateIn7Days, dayMonthFormat)}.`)
    selectVisitDateAndTime.mojAlertBody().contains('Select a new visit time.')
  })
})
