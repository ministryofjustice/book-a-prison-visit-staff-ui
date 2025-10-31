import { format, sub, addDays, eachDayOfInterval } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import Page from '../../pages/page'
import VisitDetailsPage from '../../pages/visit/visitDetails'
import SelectVisitorsPage from '../../pages/visitJourney/selectVisitors'
import ConfirmUpdatePage from '../../pages/visit/confirmUpdate'
import { SessionsAndScheduleDto } from '../../../server/data/orchestrationApiTypes'
import SelectVisitDateAndTime from '../../pages/visitJourney/selectVisitDateAndTime'
import AdditionalSupportPage from '../../pages/visitJourney/additionalSupport'
import MainContactPage from '../../pages/visitJourney/mainContact'
import CheckYourBookingPage from '../../pages/visitJourney/checkYourBooking'
import ConfirmationPage from '../../pages/visitJourney/confirmation'
import RequestMethodPage from '../../pages/visitJourney/requestMethod'

context('Update a visit', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  const today = new Date()
  const prisoner = TestData.prisoner()
  const { prisonerNumber: offenderNo } = prisoner

  const adultDob = format(sub(today, { years: 18 }), shortDateFormat)
  const childDob = format(sub(today, { years: 5 }), shortDateFormat)
  const contacts = [
    TestData.contact({ dateOfBirth: adultDob, personId: 4321 }),
    TestData.contact({
      personId: 4322,
      firstName: 'Bob',
      dateOfBirth: childDob,
      relationshipCode: 'SON',
      relationshipDescription: 'Son',
    }),
  ]

  const prison = TestData.prisonDto({
    clients: [
      { userType: 'STAFF', active: true },
      { userType: 'PUBLIC', active: true },
    ],
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison', prison)
    cy.task('stubGetVisitRequestCount', { visitRequestCount: TestData.visitRequestCount({ count: 1 }) })
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should complete the update a visit journey', () => {
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

    const originalVisit = TestData.visitBookingDetailsRaw({
      startTimestamp: sessionIn7DaysStartTimestamp,
      endTimestamp: sessionIn7DaysEndTimestamp,
      sessionTemplateReference: sessionIn7DaysTemplateReference,
      visitors: [contacts[0]],

      visitorSupport: null,
    })

    cy.task('stubGetVisitDetailed', originalVisit)

    // Visit details page
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage, { visitType: 'booking' })
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.prisonerName().contains('John Smith')

    // Start update journey
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    visitDetailsPage.updateBooking().click()

    // Select visitors page - existing visitor selected then add another
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getVisitor(contacts[0].personId).should('be.checked')
    selectVisitorsPage.getVisitor(contacts[1].personId).should('not.be.checked')
    selectVisitorsPage.getVisitor(contacts[1].personId).check()

    // Select date and time - current slot pre-selected
    cy.task('stubGetVisitSessionsAndSchedule', { prisonerId: offenderNo, visitSessionsAndSchedule })
    selectVisitorsPage.continueButton().click()
    const selectVisitDateAndTime = Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.getSessionLabel(dateIn7Days, 0).contains('Original booking')

    // Select date and time - choose different time
    const updatedApplication = TestData.application({
      startTimestamp: sessionIn8DaysStartTimestamp,
      endTimestamp: sessionIn8DaysEndTimestamp,
      visitContact: { telephone: '01234 567890', email: 'visitor@example.com', name: 'Jeanette Smith' },
      visitors: [
        { nomisPersonId: 4321, visitContact: true },
        { nomisPersonId: 4322, visitContact: false },
      ],
      visitorSupport: { description: '' },
      sessionTemplateReference: sessionIn8DaysTemplateReference,
    })
    updatedApplication.visitContact.email = 'visitor@example.com' // (may be present if visit originated in public servivce)
    cy.task('stubCreateVisitApplicationFromVisit', {
      visitReference: originalVisit.reference,
      application: updatedApplication,
    })
    selectVisitDateAndTime.clickCalendarDay(dateIn8Days)
    selectVisitDateAndTime.selectSession(dateIn8Days, 0)
    selectVisitDateAndTime.clickContinueButton()

    // Additional support - add details
    const additionalSupportPage = Page.verifyOnPage(AdditionalSupportPage)
    additionalSupportPage.additionalSupportNotRequired().should('be.checked')
    additionalSupportPage.additionalSupportRequired().should('not.be.checked')
    additionalSupportPage.additionalSupportRequired().check()
    additionalSupportPage.enterSupportDetails('Wheelchair ramp, Some extra help!')
    additionalSupportPage.continueButton().click()

    // Main contact - check pre-populated then change phone number
    const mainContactPage = Page.verifyOnPage(MainContactPage)
    mainContactPage.getFirstContact().should('be.checked')
    mainContactPage.getPhoneNumber().should('have.value', originalVisit.visitContact.telephone)
    mainContactPage.enterPhoneNumber('09876 543 321')
    mainContactPage.getEmail().should('have.value', originalVisit.visitContact.email)
    mainContactPage.enterEmail('otherEmail@test.com')
    cy.task(
      'stubChangeVisitApplication',
      TestData.application({
        startTimestamp: sessionIn8DaysStartTimestamp,
        endTimestamp: sessionIn8DaysEndTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '09876 543 321', email: 'otherEmail@test.com' },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp, Some extra help!' },
        sessionTemplateReference: sessionIn8DaysTemplateReference,
      }),
    )
    mainContactPage.continueButton().click()

    // Request method
    const requestMethodPage = Page.verifyOnPage(RequestMethodPage)
    requestMethodPage.getRequestLabelByValue('PHONE').contains('Phone call')
    requestMethodPage.getRequestMethodByValue('PHONE').check()
    requestMethodPage.continueButton().click()

    // Check your booking page
    const checkYourBookingPage = Page.verifyOnPage(CheckYourBookingPage)
    checkYourBookingPage.visitDate().contains(format(dateIn8Days, longDateFormat))
    checkYourBookingPage.visitTime().contains('1:30pm to 3pm')
    checkYourBookingPage.visitType().contains('Open')
    checkYourBookingPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    checkYourBookingPage.visitorName(2).contains('Bob Smith (son of the prisoner)')
    checkYourBookingPage.additionalSupport().contains('Wheelchair ramp, Some extra help!')
    checkYourBookingPage.mainContactName().contains('Jeanette Smith (wife of the prisoner)')
    checkYourBookingPage.mainContactNumber().contains('09876 543 321')
    checkYourBookingPage.mainContactEmail().contains('otherEmail@test.com')
    checkYourBookingPage.requestMethod().contains('Phone call')

    // Submit booking
    cy.task('stubUpdateVisit', {
      visit: TestData.visit({
        visitStatus: 'BOOKED',
        startTimestamp: sessionIn8DaysStartTimestamp,
        endTimestamp: sessionIn8DaysEndTimestamp,
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

    // Confirmation page
    const confirmationPage = Page.verifyOnPage(ConfirmationPage, { title: 'Booking updated' })
    confirmationPage.bookingReference().contains(TestData.visit().reference)
    confirmationPage.prisonerName().contains('John Smith')
    confirmationPage.prisonerNumber().contains(offenderNo)
    confirmationPage.visitDate().contains(format(dateIn8Days, longDateFormat))
    confirmationPage.visitTime().contains('1:30pm to 3pm')
    confirmationPage.visitType().contains('Open')
    confirmationPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.visitorName(2).contains('Bob Smith (son of the prisoner)')
    confirmationPage.additionalSupport().contains('Wheelchair ramp, Some extra help!')
    confirmationPage.mainContactName().contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.mainContactNumber().contains('09876 543 321')
  })

  it('should redirect to confirm update page if outside booking window limit', () => {
    const originalVisit = TestData.visitBookingDetailsRaw({
      startTimestamp: format(addDays(today, 1), `${shortDateFormat}'T'10:00:00`),
      endTimestamp: format(addDays(today, 1), `${shortDateFormat}'T'11:00:00`),
      visitorSupport: null,
    })

    cy.task('stubGetVisitDetailed', originalVisit)

    // Visit details page
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage, { visitType: 'booking' })
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.prisonerName().contains('John Smith')

    // Start update journey
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    visitDetailsPage.updateBooking().click()

    // Confirm update page - check yes
    const confirmUpdatePage = Page.verifyOnPage(ConfirmUpdatePage)
    confirmUpdatePage.confirmUpdateYesRadio().check()
    confirmUpdatePage.submit().click()

    // Select visitors page - existing visitor selected then add another
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getVisitor(contacts[0].personId).should('be.checked')
    selectVisitorsPage.getVisitor(contacts[1].personId).should('not.be.checked')
  })
})
