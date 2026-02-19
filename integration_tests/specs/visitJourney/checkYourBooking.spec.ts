import { test, expect } from '@playwright/test'
import { format, sub, addDays, eachDayOfInterval } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import PrisonerProfilePage from '../../pages-playwright/prisoner/prisonerProfilePage'
import SelectVisitorsPage from '../../pages-playwright/visitJourney/selectVisitorsPage'
import AdditionalSupportPage from '../../pages-playwright/visitJourney/additionalSupportPage'
import MainContactPage from '../../pages-playwright/visitJourney/mainContactPage'
import CheckYourBookingPage from '../../pages-playwright/visitJourney/checkYourBookingPage'
import ConfirmationPage from '../../pages-playwright/visitJourney/confirmationPage'
import SelectVisitDateAndTimePage from '../../pages-playwright/visitJourney/selectVisitDateAndTimePage'
import RequestMethodPage from '../../pages-playwright/visitJourney/requestMethodPage'
import orchestrationApi from '../../mockApis/orchestration'
import prisonerContactRegistry from '../../mockApis/prisonerContactRegistry'
import { login, resetStubs } from '../../testUtils'
import { SessionsAndScheduleDto } from '../../../server/data/orchestrationApiTypes'

test.describe('Check visit details page', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'
  const dayMonthFormat = 'd MMMM'

  const profile = TestData.prisonerProfile()
  const { prisonerId } = profile

  const today = new Date()
  const adultDob = format(sub(today, { years: 18 }), shortDateFormat)
  const childDob = format(sub(today, { years: 5 }), shortDateFormat)
  const contacts = [
    TestData.contact({ dateOfBirth: adultDob }),
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

  test.beforeEach(async () => {
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should complete the book a visit journey and change details before booking', async ({ page }) => {
    // Start - Prisoner profile page
    await prisonerContactRegistry.stubPrisonerSocialContacts({ offenderNo: prisonerId, contacts })
    await orchestrationApi.stubPrisonerProfile(profile)

    await login(page)
    await page.goto(`/prisoner/${prisonerId}`)

    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page, 'Smith, John')

    // Select visitors - first of two
    await prisonerProfilePage.bookAVisitButton.click()
    const visitorsPage = await SelectVisitorsPage.verifyOnPage(page)
    await visitorsPage.getVisitor(contacts[0].personId).check()

    // Select date and time
    await orchestrationApi.stubGetVisitSessionsAndSchedule({
      prisonerId,
      visitSessionsAndSchedule,
    })

    await orchestrationApi.stubCreateVisitApplication(
      TestData.application({
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitors: [{ nomisPersonId: contacts[0].personId }],
        sessionTemplateReference: sessionIn7DaysTemplateReference,
      }),
    )

    await visitorsPage.continueButton.click()

    const dateTimePage = await SelectVisitDateAndTimePage.verifyOnPage(page)
    await dateTimePage.selectSession(dateIn7Days, 0).click()
    await dateTimePage.continueButton.click()

    // Additional support
    const supportPage = await AdditionalSupportPage.verifyOnPage(page)
    await supportPage.additionalSupportNotRequired.check()
    await supportPage.continueButton.click()

    // Main contact
    const contactPage = await MainContactPage.verifyOnPage(page)
    await contactPage.firstContact.check()
    await contactPage.phoneNumberYesRadio.click()
    await contactPage.phoneNumberInput.fill('01234 567890')

    await orchestrationApi.stubChangeVisitApplication(
      TestData.application({
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [{ nomisPersonId: contacts[0].personId, visitContact: true }],
        visitorSupport: { description: '' },
        sessionTemplateReference: sessionIn7DaysTemplateReference,
      }),
    )

    await contactPage.continueButton.click()

    // Request method
    const requestMethodPage = await RequestMethodPage.verifyOnPage(page)
    await requestMethodPage.getRequestMethodByValue('PHONE').check()
    await requestMethodPage.continueButton.click()

    // Check visit details
    const checkYourBookingPage = await CheckYourBookingPage.verifyOnPage(page)
    await expect(checkYourBookingPage.prisonerName).toContainText('John Smith')
    await expect(checkYourBookingPage.visitorName(1)).toContainText('Jeanette Smith (wife of the prisoner)')
    await expect(checkYourBookingPage.visitDate).toContainText(format(dateIn7Days, longDateFormat))
    await expect(checkYourBookingPage.visitTime).toContainText('10am to 11am')
    await expect(checkYourBookingPage.visitType).toContainText('Open')
    await expect(checkYourBookingPage.additionalSupport).toHaveText('None')
    await expect(checkYourBookingPage.requestMethod).toContainText('Phone call')
    await expect(checkYourBookingPage.mainContactName).toContainText('Jeanette Smith (wife of the prisoner)')
    await expect(checkYourBookingPage.mainContactNumber).toContainText('01234 567890')

    // Change visit date  - then proceed through journey
    await checkYourBookingPage.changeVisitDate.click()

    await dateTimePage.clickCalendarDay(dateIn8Days).click()
    await dateTimePage.selectSession(dateIn8Days, 0).click({ force: true })
    await orchestrationApi.stubChangeVisitApplication(
      TestData.application({
        startTimestamp: sessionIn8DaysStartTimestamp,
        endTimestamp: sessionIn8DaysEndTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [{ nomisPersonId: contacts[0].personId, visitContact: true }],
        visitorSupport: { description: '' },
        sessionTemplateReference: sessionIn8DaysTemplateReference,
      }),
    )

    await dateTimePage.continueButton.click()
    await supportPage.continueButton.click()
    await contactPage.continueButton.click()
    await requestMethodPage.continueButton.click()

    await expect(checkYourBookingPage.visitDate).toContainText(format(dateIn8Days, longDateFormat))
    await expect(checkYourBookingPage.visitTime).toContainText('1:30pm to 3pm')

    // Check details - Change visitors
    await checkYourBookingPage.changeVisitors.click()
    await expect(visitorsPage.getVisitor(contacts[0].personId)).toBeChecked()
    await expect(visitorsPage.getVisitor(contacts[1].personId)).not.toBeChecked()
    await visitorsPage.getVisitor(contacts[1].personId).check()
    await visitorsPage.continueButton.click()

    await orchestrationApi.stubChangeVisitApplication(
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

    await dateTimePage.continueButton.click()
    await supportPage.continueButton.click()
    await contactPage.continueButton.click()
    await requestMethodPage.continueButton.click()

    // Check the second visitor is added
    await expect(checkYourBookingPage.visitorName(1)).toContainText('Jeanette Smith (wife of the prisoner)')
    await expect(checkYourBookingPage.visitorName(2)).toContainText('Bob Smith (son of the prisoner)')

    /// Check details - change additional support - then proceed through journey
    await checkYourBookingPage.changeAdditionalSupport.click()
    await supportPage.additionalSupportRequired.check()
    await supportPage.additionalSupportInput.fill('Wheelchair ramp, Some extra help!')
    await supportPage.continueButton.click()
    await orchestrationApi.stubChangeVisitApplication(
      TestData.application({
        startTimestamp: sessionIn8DaysStartTimestamp,
        endTimestamp: sessionIn8DaysEndTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp, Some extra help!' },
        sessionTemplateReference: sessionIn8DaysTemplateReference,
      }),
    )
    await contactPage.continueButton.click()
    await requestMethodPage.continueButton.click()
    await expect(checkYourBookingPage.additionalSupport).toContainText('Wheelchair ramp, Some extra help!')

    // Change details -Change main contant details  - then proceed through journey
    await checkYourBookingPage.changeMainContact.click()
    await contactPage.enterPhoneNumber('09876 543 321')
    await orchestrationApi.stubChangeVisitApplication(
      TestData.application({
        startTimestamp: sessionIn8DaysStartTimestamp,
        endTimestamp: sessionIn8DaysEndTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '09876 543 321' },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp, Some extra help!' },
        sessionTemplateReference: sessionIn8DaysTemplateReference,
      }),
    )
    await contactPage.continueButton.click()
    await requestMethodPage.continueButton.click()
    await expect(checkYourBookingPage.mainContactNumber).toContainText('09876 543 321')

    // Change details - Change request method  - then proceed through journey
    await checkYourBookingPage.changeRequestMethod.click()
    await expect(requestMethodPage.getRequestLabelByValue('WEBSITE')).toContainText('GOV.UK')
    await requestMethodPage.getRequestMethodByValue('WEBSITE').check()
    await requestMethodPage.continueButton.click()
    await expect(checkYourBookingPage.requestMethod).toContainText('GOV.UK')

    // Stub for the confirmation page
    await orchestrationApi.stubBookVisit({
      visit: TestData.visit({
        visitStatus: 'BOOKED',
        startTimestamp: sessionIn8DaysStartTimestamp,
        endTimestamp: sessionIn8DaysEndTimestamp,
      }),
      applicationMethod: 'WEBSITE',
      username: 'USER1',
      allowOverBooking: false,

      visitorDetails: [
        { visitorId: 4321, visitorAge: 18 },
        { visitorId: 4322, visitorAge: 5 },
      ],
    })

    await checkYourBookingPage.submitBooking()

    // Check details on the Confirmation page
    const confirmationPage = await ConfirmationPage.verifyOnPage(page, 'Visit confirmed')
    await expect(confirmationPage.bookingReference).toContainText(TestData.visit().reference)
    await expect(confirmationPage.prisonerName).toContainText('John Smith')
    await expect(confirmationPage.prisonName).toContainText('Hewell (HMP)')
    await expect(confirmationPage.visitDate).toContainText(format(dateIn8Days, longDateFormat))
    await expect(confirmationPage.visitTime).toContainText('1:30pm to 3pm')
    await expect(confirmationPage.visitType).toContainText('Open')
    await expect(confirmationPage.visitorName(1)).toContainText('Jeanette Smith (wife of the prisoner)')
    await expect(confirmationPage.visitorName(2)).toContainText('Bob Smith (son of the prisoner)')
    await expect(confirmationPage.additionalSupport).toContainText('Wheelchair ramp, Some extra help!')
    await expect(confirmationPage.mainContactName).toContainText('Jeanette Smith (wife of the prisoner)')
    await expect(confirmationPage.mainContactNumber).toContainText('09876 543 321')
  })

  test('should display validation error message after failing to submit booking', async ({ page }) => {
    await prisonerContactRegistry.stubPrisonerSocialContacts({ offenderNo: prisonerId, contacts })
    await orchestrationApi.stubPrisonerProfile(profile)

    await login(page)
    await page.goto(`/prisoner/${prisonerId}`)

    // Prisoner profile
    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page, 'Smith, John')
    await prisonerProfilePage.bookAVisitButton.click()

    // Select visitor
    const visitorsPage = await SelectVisitorsPage.verifyOnPage(page)
    await visitorsPage.getVisitor(contacts[0].personId).check()

    // Sessions + create application
    await orchestrationApi.stubGetVisitSessionsAndSchedule({
      prisonerId,
      visitSessionsAndSchedule,
    })

    await orchestrationApi.stubCreateVisitApplication(
      TestData.application({
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitors: [{ nomisPersonId: contacts[0].personId }],
        sessionTemplateReference: sessionIn7DaysTemplateReference,
      }),
    )

    await visitorsPage.continueButton.click()

    // Select date/time
    const selectVisitDateAndTime = await SelectVisitDateAndTimePage.verifyOnPage(page)
    await selectVisitDateAndTime.selectSession(dateIn7Days, 0).click()
    await selectVisitDateAndTime.continueButton.click()

    // Additional support
    const supportPage = await AdditionalSupportPage.verifyOnPage(page)
    await supportPage.additionalSupportNotRequired.check()
    await supportPage.continueButton.click()

    // Main contact
    const contactPage = await MainContactPage.verifyOnPage(page)
    await contactPage.firstContact.check()
    await contactPage.phoneNumberYesRadio.click()
    await contactPage.phoneNumberInput.fill('01234 567890')

    await orchestrationApi.stubChangeVisitApplication(
      TestData.application({
        startTimestamp: sessionIn7DaysStartTimestamp,
        endTimestamp: sessionIn7DaysEndTimestamp,
        visitContact: { name: 'Jeanette Smith', telephone: '01234 567890' },
        visitors: [{ nomisPersonId: contacts[0].personId, visitContact: true }],
        visitorSupport: { description: '' },
        sessionTemplateReference: sessionIn7DaysTemplateReference,
      }),
    )

    await contactPage.continueButton.click()

    // Request method
    const requestMethodPage = await RequestMethodPage.verifyOnPage(page)
    await expect(requestMethodPage.getRequestLabelByValue('PHONE')).toContainText('Phone call')
    await requestMethodPage.getRequestMethodByValue('PHONE').check()
    await requestMethodPage.continueButton.click()

    // Check visit details
    const checkYourBookingPage = await CheckYourBookingPage.verifyOnPage(page)
    await expect(checkYourBookingPage.prisonerName).toContainText('John Smith')
    await expect(checkYourBookingPage.visitDate).toContainText(format(dateIn7Days, longDateFormat))

    // ---- Validation failure stub ----
    await orchestrationApi.stubBookVisitValidationFailed({
      applicationReference: TestData.visit().applicationReference,
      validationErrors: ['APPLICATION_INVALID_NON_ASSOCIATION_VISITS'],
    })

    await orchestrationApi.stubGetVisitSessionsAndSchedule({ prisonerId })

    await checkYourBookingPage.submitBooking()

    // Should return to date/time page with alert
    const dateTimePage = await SelectVisitDateAndTimePage.verifyOnPage(page)

    // Check date on select date and time page
    await expect(dateTimePage.messages.first()).toContainText(
      `John Smith now has a non-association on ${format(dateIn7Days, dayMonthFormat)}.`,
    )

    // Check alert on select date and time page
    await expect(dateTimePage.alertOnPage).toContainText('Select a new visit time.')
  })
})
