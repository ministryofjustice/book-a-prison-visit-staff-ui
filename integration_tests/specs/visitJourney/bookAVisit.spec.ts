import { expect, test } from '@playwright/test'
import { addDays, format, sub, eachDayOfInterval } from 'date-fns'
import orchestrationApi from '../../mockApis/orchestration'
import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages-playwright/homePage'
import SearchForAPrisonerPage from '../../pages-playwright/search/searchForAPrisonerPage'
import SearchForAPrisonerResultsPage from '../../pages-playwright/search/searchForPrinsonerResultsPage'
import PrisonerProfilePage from '../../pages-playwright/prisoner/prisonerProfilePage'
import SelectVisitorsPage from '../../pages-playwright/visitJourney/selectVisitorsPage'
import TestData from '../../../server/routes/testutils/testData'
import prisonerContactRegistry from '../../mockApis/prisonerContactRegistry'
import SelectVisitDateAndTimePage from '../../pages-playwright/visitJourney/selectVisitDateAndTimePage'
import { SessionsAndScheduleDto } from '../../../server/data/orchestrationApiTypes'
import AdditionalSupportPage from '../../pages-playwright/visitJourney/additionalSupportPage'
import MainContactPage from '../../pages-playwright/visitJourney/mainContactPage'
import RequestMethodPage from '../../pages-playwright/visitJourney/requestMethodPage'
import CheckYourBookingPage from '../../pages-playwright/visitJourney/checkYourBookingPage'
import ConfirmationPage from '../../pages-playwright/visitJourney/confirmationPage'

test.describe('Book a visit', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  const today = new Date()

  test.beforeEach(async () => {
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should complete the book a visit journey', async ({ page }) => {
    const adultDob = format(sub(today, { years: 18 }), shortDateFormat)
    const childDob = format(sub(today, { years: 5 }), shortDateFormat)

    const contacts = [
      TestData.contact({
        dateOfBirth: adultDob,
        restrictions: [TestData.restriction()],
      }),
      TestData.contact({
        personId: 4322,
        firstName: 'Bob',
        lastName: 'Smith',
        dateOfBirth: childDob,
        relationshipCode: 'SON',
        relationshipDescription: 'Son',
        restrictions: [],
        addresses: [TestData.address()],
      }),
    ]
    // Social contacts
    const socialContacts = contacts.map(contact => ({
      personId: contact.personId!,
      firstName: contact.firstName,
      lastName: contact.lastName!,
      dateOfBirth: contact.dateOfBirth!,
      restrictions: contact.restrictions || [],
      addresses: contact.addresses || [],
      relationshipCode: contact.relationshipCode || 'OTHER',
      contactType: 'SOCIAL',
      approvedVisitor: true,
      emergencyContact: false,
      nextOfKin: false,
    }))

    const prisoner = TestData.prisoner()
    const { prisonerNumber: offenderNo } = prisoner

    // Define the restrictions once
    const prisonerRestrictions = [TestData.offenderRestriction()]
    // --- Stub prisoner profile ---
    await orchestrationApi.stubPrisonerProfile(
      TestData.prisonerProfile({
        prisonerId: offenderNo,
        firstName: 'John',
        lastName: 'Smith',
        alerts: [
          {
            alertType: 'U',
            alertTypeDescription: 'COVID unit management',
            alertCode: 'UPIU',
            alertCodeDescription: 'Protective Isolation Unit',
            comment: 'Alert comment \n This part is hidden by default',
            startDate: '2023-01-02',
            active: true,
          },
        ],
        prisonerRestrictions: [TestData.offenderRestriction()],
      }),
    )

    // --- Stub prisoner search API results ---
    await orchestrationApi.stubPrisoners({
      term: offenderNo,
      results: {
        totalElements: 1,
        totalPages: 1,
        content: [
          {
            prisonerNumber: offenderNo,
            firstName: 'John',
            lastName: 'Smith',
            dateOfBirth: '1990-01-01',
          },
        ],
      },
    })

    // generate array of dates over next month and add some visit sessions and events as defined in Cypress tests
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

    // --- Login and start journey ---
    await login(page)
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.bookOrChangeVisitTile.click()

    // --- Navigate to search page ---
    const searchPage = await SearchForAPrisonerPage.verifyOnPage(page)

    // --- Perform search ---
    await searchPage.searchInput.fill(offenderNo)
    await searchPage.searchButton.click()

    // --- Verify search results page ---
    const searchResultsPage = await SearchForAPrisonerResultsPage.verifyOnPage(page)
    await expect(searchResultsPage.resultRows.first()).toBeVisible()
    await expect(searchResultsPage.resultRows).toHaveCount(1)
    await expect(searchResultsPage.firstResultLink).toHaveText('Smith, John')

    // // --- Go to prisoner profile page ---
    await searchResultsPage.firstResultLink.click()
    const profilePage = await PrisonerProfilePage.verifyOnPage(page)
    await prisonerContactRegistry.stubPrisonerSocialContacts({
      offenderNo,
      contacts: socialContacts,
    })
    await profilePage.bookAVisitButton.click()

    // // --- Select visitors page ---
    const selectVisitorsPage = await SelectVisitorsPage.verifyOnPage(page)
    await expect(selectVisitorsPage.getPrisonerRestrictionType(1)).toHaveText(
      prisonerRestrictions[0].restrictionTypeDescription,
    )
    await expect(selectVisitorsPage.getPrisonerAlertEndDate(1)).toHaveText('No end date')
    await expect(selectVisitorsPage.getPrisonerAlertType(1)).toHaveText('Protective Isolation Unit')
    await selectVisitorsPage.showFullCommentLink.click()
    await expect(selectVisitorsPage.getPrisonerAlertComment(1)).toContainText('This part is hidden by default')
    await selectVisitorsPage.closeFullCommentLink.click()
    await selectVisitorsPage.getVisitor(contacts[0].personId).check()
    await selectVisitorsPage.getVisitor(contacts[1].personId).check()

    // --- Stub visit sessions and schedule ---
    await orchestrationApi.stubGetVisitSessionsAndSchedule({
      prisonerId: offenderNo,
      visitSessionsAndSchedule,
      username: 'USER1',
      minNumberOfDays: 3,
      prisonId: 'HEI',
    })

    // --- Stub creating a visit application ---
    await orchestrationApi.stubCreateVisitApplication(
      TestData.application({
        prisonerId: offenderNo,
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitors: [{ nomisPersonId: contacts[0].personId }, { nomisPersonId: contacts[1].personId }],
      }),
    )

    await selectVisitorsPage.continueButton.click()
    const selectVisitDateAndTime = await SelectVisitDateAndTimePage.verifyOnPage(page)
    await selectVisitDateAndTime.selectSession(dateIn7Days, 0).click()

    // Additional support
    await selectVisitDateAndTime.continueButton.click()
    const additionalSupportPage = await AdditionalSupportPage.verifyOnPage(page)
    await additionalSupportPage.additionalSupportRequired.check()
    await additionalSupportPage.additionalSupportInput.fill('Wheelchair ramp, Some extra help!')

    // Main contact
    await additionalSupportPage.continueButton.click()
    const mainContactPage = await MainContactPage.verifyOnPage(page)
    await mainContactPage.firstContact.check()
    await mainContactPage.phoneNumberYesRadio.click()
    await mainContactPage.phoneNumberInput.fill('07712 000 000')
    await orchestrationApi.stubChangeVisitApplication(
      TestData.application({
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitContact: {
          name: 'Jeanette Smith',
          telephone: '07712 000 000',
        },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: {
          description: 'Wheelchair ramp, Some extra help!',
        },
        sessionTemplateReference: sessionIn7DaysTemplateReference,
      }),
    )
    // Request method
    mainContactPage.continueButton.click()
    const requestMethodPage = await RequestMethodPage.verifyOnPage(page)
    await expect(requestMethodPage.getRequestLabelByValue('PHONE')).toContainText('Phone call')
    await requestMethodPage.getRequestMethodByValue('PHONE').check()
    await requestMethodPage.continueButton.click()

    // Check booking details
    const checkYourBookingPage = await CheckYourBookingPage.verifyOnPage(page)
    await expect(checkYourBookingPage.prisonerName).toContainText('John Smith')
    await expect(checkYourBookingPage.visitDate).toContainText(format(dateIn7Days, longDateFormat))
    await expect(checkYourBookingPage.visitTime).toContainText('10am to 11am')
    await expect(checkYourBookingPage.visitType).toContainText('Open')
    await expect(checkYourBookingPage.visitorName(1)).toContainText('Jeanette Smith')
    await expect(checkYourBookingPage.visitorName(2)).toContainText('Bob Smith')
    await expect(checkYourBookingPage.additionalSupport).toContainText('Wheelchair ramp, Some extra help!')
    await expect(checkYourBookingPage.mainContactName).toContainText('Jeanette Smith')
    await expect(checkYourBookingPage.mainContactNumber).toContainText('07712 000 000')
    await expect(checkYourBookingPage.requestMethod).toContainText('Phone call')

    // --- Stub booking confirmation ---

    await orchestrationApi.stubBookVisit({
      visit: TestData.visit({
        visitStatus: 'BOOKED',
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitContact: {
          name: 'Jeanette smith',
          telephone: '07712 000 000',
        },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: {
          description: 'Wheelchair ramp, Some extra help!',
        },
      }),
      applicationMethod: 'PHONE',
      username: 'USER1',
      allowOverBooking: false,
      visitorDetails: [
        { visitorId: contacts[0].personId, visitorAge: 18 },
        { visitorId: contacts[1].personId, visitorAge: 5 },
      ],
    })

    await checkYourBookingPage.submitButton.click()
    const confirmationPage = await ConfirmationPage.verifyOnPage(page)
    await expect(confirmationPage.bookingReference).toContainText(TestData.visit().reference)
    await expect(confirmationPage.prisonerName).toContainText('John Smith')
    await expect(confirmationPage.prisonerNumber).toContainText(offenderNo)
    await expect(confirmationPage.prisonName).toContainText('Hewell (HMP)')
    await expect(confirmationPage.visitDate).toContainText(format(dateIn7Days, longDateFormat))
    await expect(confirmationPage.visitTime).toContainText('10am to 11am')
    await expect(confirmationPage.visitType).toContainText('Open')
    await expect(confirmationPage.visitorName(1)).toContainText('Jeanette Smith')
    await expect(confirmationPage.visitorName(2)).toContainText('Bob Smith')
    await expect(confirmationPage.additionalSupport).toContainText('Wheelchair ramp, Some extra help!')
    await expect(confirmationPage.mainContactName).toContainText('Jeanette Smith')
    await expect(confirmationPage.mainContactNumber).toContainText('07712 000 000')
    await confirmationPage.viewPrisonersProfileButton(offenderNo)
  })
})
