import { format, sub, addDays } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import Page from '../pages/page'
import VisitDetailsPage from '../pages/visitDetails'
import SelectVisitorsPage from '../pages/selectVisitors'
import ConfirmUpdatePage from '../pages/confirmUpdate'
import { VisitSession } from '../../server/data/orchestrationApiTypes'
import SelectVisitDateAndTime from '../pages/selectVisitDateAndTime'
import AdditionalSupportPage from '../pages/additionalSupport'
import MainContactPage from '../pages/mainContact'
import CheckYourBookingPage from '../pages/checkYourBooking'
import ConfirmationPage from '../pages/confirmation'
import RequestMethodPage from '../pages/requestMethod'

context('Update a visit', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  const today = new Date()
  const prisoner = TestData.prisoner()
  const { prisonerNumber: offenderNo, prisonId } = prisoner

  const profile = TestData.prisonerProfile({
    alerts: [
      {
        alertType: 'U',
        alertTypeDescription: 'COVID unit management',
        alertCode: 'UPIU',
        alertCodeDescription: 'Protective Isolation Unit',
        comment: 'Alert comment',
        dateCreated: '2023-01-02',
        dateExpires: undefined,
        active: true,
      },
    ],
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('should complete the update a visit journey', () => {
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

    const originalVisit = TestData.visit({
      startTimestamp: visitSessions[0].startTimestamp,
      endTimestamp: visitSessions[0].endTimestamp,
      visitors: [{ nomisPersonId: 4321, visitContact: true }],
      visitorSupport: { description: '' },
    })
    const visitHistoryDetails = TestData.visitHistoryDetails({ visit: originalVisit })

    const childDob = format(sub(today, { years: 5 }), shortDateFormat)
    const contacts = [
      TestData.contact({ personId: 4321 }),
      TestData.contact({
        personId: 4322,
        firstName: 'Bob',
        dateOfBirth: childDob,
        relationshipCode: 'SON',
        relationshipDescription: 'Son',
      }),
    ]

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails) // TODO remove when visit update no longer uses this endpoint
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts, approvedVisitorsOnly: false })
    cy.task(
      'stubGetVisitDetailed',
      TestData.visitBookingDetailsDto({
        startTimestamp: originalVisit.startTimestamp,
        endTimestamp: originalVisit.endTimestamp,
        visitors: [contacts[0]],
      }),
    )

    // Visit details page
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.prisonerName().contains('John Smith')

    // Start update journey
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubOffenderRestrictions', { offenderNo, offenderRestrictions: [] })
    cy.task('stubPrisonerProfile', profile)

    visitDetailsPage.updateBooking().click()

    // Select visitors page - existing visitor selected then add another
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getVisitor(contacts[0].personId).should('be.checked')
    selectVisitorsPage.getVisitor(contacts[1].personId).should('not.be.checked')
    selectVisitorsPage.getVisitor(contacts[1].personId).check()

    // Select date and time - current slot pre-selected
    cy.task('stubVisitSessions', {
      offenderNo,
      prisonId,
      visitSessions,
    })
    cy.task('stubOffenderEvents', {
      offenderNo,
      fromDate: format(today, shortDateFormat),
      toDate: format(addDays(today, 8), shortDateFormat),
      scheduledEvents: [],
    })
    selectVisitorsPage.continueButton().click()
    const selectVisitDateAndTime = Page.verifyOnPage(SelectVisitDateAndTime)
    selectVisitDateAndTime.expandAllSections()
    selectVisitDateAndTime.getSlotById(1).should('be.checked')

    // Select date and time - choose different time
    const updatedApplication = TestData.application({
      startTimestamp: visitSessions[1].startTimestamp,
      endTimestamp: visitSessions[1].endTimestamp,
      visitors: [
        { nomisPersonId: 4321, visitContact: true },
        { nomisPersonId: 4322, visitContact: false },
      ],
      visitorSupport: { description: '' },
    })
    updatedApplication.visitContact.email = 'visitor@example.com' // (may be present if visit originated in public servivce)
    cy.task('stubCreateVisitApplicationFromVisit', {
      visitReference: visitHistoryDetails.visit.reference,
      application: updatedApplication,
    })
    selectVisitDateAndTime.getSlotById(2).check()
    selectVisitDateAndTime.continueButton().click()

    // Additional support - add wheelchair and custom option
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
    cy.task(
      'stubChangeVisitApplication',
      TestData.application({
        startTimestamp: visitSessions[1].startTimestamp,
        endTimestamp: visitSessions[1].endTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '09876 543 321', email: 'visitor@example.com' },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp, Some extra help!' },
        sessionTemplateReference: visitSessions[1].sessionTemplateReference,
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
    checkYourBookingPage.visitDate().contains(format(new Date(visitSessions[1].startTimestamp), longDateFormat))
    checkYourBookingPage.visitTime().contains('1:30pm to 3pm')
    checkYourBookingPage.visitType().contains('Open')
    checkYourBookingPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    checkYourBookingPage.visitorName(2).contains('Bob Smith (son of the prisoner)')
    checkYourBookingPage.additionalSupport().contains('Wheelchair ramp, Some extra help!')
    checkYourBookingPage.mainContactName().contains('Jeanette Smith (wife of the prisoner)')
    checkYourBookingPage.mainContactNumber().contains('09876 543 321')
    checkYourBookingPage.requestMethod().contains('Phone call')

    // Submit booking
    cy.task('stubBookVisit', {
      visit: TestData.visit({
        visitStatus: 'BOOKED',
        startTimestamp: visitSessions[1].startTimestamp,
        endTimestamp: visitSessions[1].endTimestamp,
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp, Some extra help!' },
      }),
      applicationMethod: 'PHONE',
      username: 'USER1',
    })
    checkYourBookingPage.submitBooking()

    // Confirmation page
    const confirmationPage = Page.verifyOnPageTitle(ConfirmationPage, 'Booking updated')
    confirmationPage.bookingReference().contains(TestData.visit().reference)
    confirmationPage.prisonerName().contains('Smith, John')
    confirmationPage.prisonerNumber().contains(offenderNo)
    confirmationPage.visitDate().contains(format(new Date(visitSessions[1].startTimestamp), longDateFormat))
    confirmationPage.visitTime().contains('1:30pm to 3pm')
    confirmationPage.visitType().contains('Open')
    confirmationPage.visitorName(1).contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.visitorName(2).contains('Bob Smith (son of the prisoner)')
    confirmationPage.additionalSupport().contains('Wheelchair ramp, Some extra help!')
    confirmationPage.mainContactName().contains('Jeanette Smith (wife of the prisoner)')
    confirmationPage.mainContactNumber().contains('09876 543 321')
  })

  it('should redirect to confirm update page if outside booking window limit', () => {
    const visitSessions: VisitSession[] = [
      TestData.visitSession({
        startTimestamp: format(addDays(today, 1), `${shortDateFormat}'T'10:00:00`),
        endTimestamp: format(addDays(today, 1), `${shortDateFormat}'T'11:00:00`),
      }),
      TestData.visitSession({
        startTimestamp: format(addDays(today, 8), `${shortDateFormat}'T'13:30:00`),
        endTimestamp: format(addDays(today, 8), `${shortDateFormat}'T'15:00:00`),
      }),
    ]

    const originalVisit = TestData.visit({
      startTimestamp: visitSessions[0].startTimestamp,
      endTimestamp: visitSessions[0].endTimestamp,
      visitors: [{ nomisPersonId: 4321, visitContact: true }],
      visitorSupport: { description: '' },
    })
    const visitHistoryDetails = TestData.visitHistoryDetails({ visit: originalVisit })

    const childDob = format(sub(today, { years: 5 }), shortDateFormat)
    const contacts = [
      TestData.contact({ personId: 4321 }),
      TestData.contact({
        personId: 4322,
        firstName: 'Bob',
        dateOfBirth: childDob,
        relationshipCode: 'SON',
        relationshipDescription: 'Son',
      }),
    ]

    cy.task('stubPrisonerById', prisoner)
    cy.task('stubVisitHistory', visitHistoryDetails)
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts, approvedVisitorsOnly: false })
    cy.task(
      'stubGetVisitDetailed',
      TestData.visitBookingDetailsDto({
        startTimestamp: originalVisit.startTimestamp,
        endTimestamp: originalVisit.endTimestamp,
        visitors: [contacts[0]],
      }),
    )

    // Visit details page
    cy.visit('/visit/ab-cd-ef-gh')
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.prisonerName().contains('John Smith')

    // Start update journey
    cy.task('stubPrisonerSocialContacts', { offenderNo, contacts })
    cy.task('stubOffenderRestrictions', { offenderNo, offenderRestrictions: [] })
    cy.task('stubPrisonerProfile', profile)
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
