import { addDays, format, sub } from 'date-fns'
import Page from '../pages/page'
import PrisonerProfilePage from '../pages/prisonerProfile'
import SelectVisitorsPage from '../pages/selectVisitors'
import TestData from '../../server/routes/testutils/testData'
import { VisitSession } from '../../server/data/orchestrationApiTypes'
import AdditionalSupportPage from '../pages/additionalSupport'
import MainContactPage from '../pages/mainContact'
import CheckYourBookingPage from '../pages/checkYourBooking'
import ConfirmationPage from '../pages/confirmation'
import SelectVisitDateAndTime from '../pages/selectVisitDateAndTime'
import RequestMethodPage from '../pages/requestMethod'

context('Check visit details page', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should complete the book a visit journey and change details before booking', () => {
    const profile = TestData.prisonerProfile()
    const { prisonerId, prisonId } = profile
    const prisonerDisplayName = 'Smith, John'

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

    const visitSessions: VisitSession[] = [
      TestData.visitSession({
        startTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'10:00:00`),
        endTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'11:00:00`),
      }),
      TestData.visitSession({
        startTimestamp: format(addDays(today, 8), `${shortDateFormat}'T'13:30:00`),
        endTimestamp: format(addDays(today, 8), `${shortDateFormat}'T'15:00:00`),
      }),
    ]

    // Start - Prisoner profile page
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerId, contacts })
    cy.task('stubPrisonerProfile', profile)
    cy.visit(`/prisoner/${prisonerId}`)

    const prisonerProfilePage = Page.verifyOnPageTitle(PrisonerProfilePage, prisonerDisplayName)

    // Select visitors - first of two
    cy.task('stubOffenderRestrictions', { offenderNo: prisonerId, offenderRestrictions: [] })
    prisonerProfilePage.bookAVisitButton().click()
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getVisitor(contacts[0].personId).check()

    // Select date and time
    cy.task('stubVisitSessions', {
      offenderNo: prisonerId,
      prisonId,
      visitSessions,
    })
    cy.task('stubOffenderEvents', {
      offenderNo: prisonerId,
      fromDate: format(today, shortDateFormat),
      toDate: format(addDays(today, 8), shortDateFormat),
      scheduledEvents: [],
    })
    cy.task(
      'stubCreateVisitApplication',
      TestData.application({
        startTimestamp: visitSessions[0].startTimestamp,
        endTimestamp: visitSessions[0].endTimestamp,
        visitors: [{ nomisPersonId: contacts[0].personId }],
      }),
    )
    selectVisitorsPage.continueButton().click()
    const selectVisitDateAndTime = Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.expandAllSections()
    selectVisitDateAndTime.getSlotById(1).check()

    // Additional support
    selectVisitDateAndTime.continueButton().click()
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
        startTimestamp: visitSessions[0].startTimestamp,
        endTimestamp: visitSessions[0].endTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [{ nomisPersonId: contacts[0].personId, visitContact: true }],
        visitorSupport: { description: '' },
        sessionTemplateReference: visitSessions[0].sessionTemplateReference,
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
    checkYourBookingPage.prisonerName().contains(prisonerDisplayName)
    checkYourBookingPage.visitDate().contains(format(new Date(visitSessions[0].startTimestamp), longDateFormat))
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
    selectVisitDateAndTime.expandAllSections()
    selectVisitDateAndTime.getSlotById(1).should('be.checked')
    selectVisitDateAndTime.getSlotById(2).check()
    cy.task(
      'stubChangeVisitApplication',
      TestData.application({
        startTimestamp: visitSessions[1].startTimestamp,
        endTimestamp: visitSessions[1].endTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [{ nomisPersonId: contacts[0].personId, visitContact: true }],
        visitorSupport: { description: '' },
        sessionTemplateReference: visitSessions[1].sessionTemplateReference,
      }),
    )
    selectVisitDateAndTime.continueButton().click()
    additionalSupportPage.continueButton().click()
    mainContactPage.continueButton().click()
    requestMethodPage.continueButton().click()
    checkYourBookingPage.visitDate().contains(format(new Date(visitSessions[1].startTimestamp), longDateFormat))
    checkYourBookingPage.visitTime().contains('1:30pm to 3pm')

    // Check details - change visitors, add visitor - then proceed through journey
    checkYourBookingPage.changeVisitors().click()
    selectVisitorsPage.getVisitor(contacts[0].personId).should('be.checked')
    selectVisitorsPage.getVisitor(contacts[1].personId).should('not.be.checked')
    selectVisitorsPage.getVisitor(contacts[1].personId).check()
    selectVisitorsPage.continueButton().click()
    selectVisitDateAndTime.getSlotById(2).should('be.checked')
    cy.task(
      'stubChangeVisitApplication',
      TestData.application({
        startTimestamp: visitSessions[1].startTimestamp,
        endTimestamp: visitSessions[1].endTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: '' },
        sessionTemplateReference: visitSessions[1].sessionTemplateReference,
      }),
    )
    selectVisitDateAndTime.continueButton().click()
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
        startTimestamp: visitSessions[1].startTimestamp,
        endTimestamp: visitSessions[1].endTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp' },
        sessionTemplateReference: visitSessions[1].sessionTemplateReference,
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
        startTimestamp: visitSessions[1].startTimestamp,
        endTimestamp: visitSessions[1].endTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '09876 543 321' },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp' },
        sessionTemplateReference: visitSessions[1].sessionTemplateReference,
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
        startTimestamp: visitSessions[1].startTimestamp,
        endTimestamp: visitSessions[1].endTimestamp,
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
    const confirmationPage = Page.verifyOnPageTitle(ConfirmationPage, 'Booking confirmed')
    confirmationPage.bookingReference().contains(TestData.visit().reference)
    confirmationPage.prisonerName().contains(prisonerDisplayName)
    confirmationPage.prisonerNumber().contains(prisonerId)
    confirmationPage.visitDate().contains(format(new Date(visitSessions[1].startTimestamp), longDateFormat))
    confirmationPage.visitTime().contains('1:30pm to 3pm')
    confirmationPage.visitType().contains('Open')
    confirmationPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.visitorName(2).contains('Bob Smith (son of the prisoner)')
    confirmationPage.additionalSupport().contains('Wheelchair ramp')
    confirmationPage.mainContactName().contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.mainContactNumber().contains('09876 543 321')
  })

  it('should display validation error message after failing to submit booking', () => {
    const profile = TestData.prisonerProfile()
    const { prisonerId, prisonId } = profile
    const prisonerDisplayName = 'Smith, John'

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

    const visitSessions: VisitSession[] = [
      TestData.visitSession({
        startTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'10:00:00`),
        endTimestamp: format(addDays(today, 7), `${shortDateFormat}'T'11:00:00`),
      }),
      TestData.visitSession({
        startTimestamp: format(addDays(today, 8), `${shortDateFormat}'T'13:30:00`),
        endTimestamp: format(addDays(today, 8), `${shortDateFormat}'T'15:00:00`),
      }),
    ]

    // Start - Prisoner profile page
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerId, contacts })
    cy.task('stubPrisonerProfile', profile)
    cy.visit(`/prisoner/${prisonerId}`)

    const prisonerProfilePage = Page.verifyOnPageTitle(PrisonerProfilePage, prisonerDisplayName)

    // Select visitors - first of two
    cy.task('stubOffenderRestrictions', { offenderNo: prisonerId, offenderRestrictions: [] })
    prisonerProfilePage.bookAVisitButton().click()
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getVisitor(contacts[0].personId).check()

    // Select date and time
    cy.task('stubVisitSessions', {
      offenderNo: prisonerId,
      prisonId,
      visitSessions,
    })
    cy.task('stubOffenderEvents', {
      offenderNo: prisonerId,
      fromDate: format(today, shortDateFormat),
      toDate: format(addDays(today, 8), shortDateFormat),
      scheduledEvents: [],
    })
    cy.task(
      'stubCreateVisitApplication',
      TestData.application({
        startTimestamp: visitSessions[0].startTimestamp,
        endTimestamp: visitSessions[0].endTimestamp,
        visitors: [{ nomisPersonId: contacts[0].personId }],
      }),
    )
    selectVisitorsPage.continueButton().click()
    const selectVisitDateAndTime = Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.expandAllSections()
    selectVisitDateAndTime.getSlotById(1).check()

    // Additional support
    selectVisitDateAndTime.continueButton().click()
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
        startTimestamp: visitSessions[0].startTimestamp,
        endTimestamp: visitSessions[0].endTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [{ nomisPersonId: contacts[0].personId, visitContact: true }],
        visitorSupport: { description: '' },
        sessionTemplateReference: visitSessions[0].sessionTemplateReference,
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
    checkYourBookingPage.prisonerName().contains(prisonerDisplayName)
    checkYourBookingPage.visitDate().contains(format(new Date(visitSessions[0].startTimestamp), longDateFormat))

    cy.task('stubBookVisitValidationFailed', {
      applicationReference: TestData.visit().applicationReference,
    })

    checkYourBookingPage.submitBooking()

    // Check alert on select date and time page
    Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.mojAlertTitle().contains('Smith, John now has a non-association on 1 April.')
    selectVisitDateAndTime.mojAlertBody().contains('Select a new visit time.')
  })
})
