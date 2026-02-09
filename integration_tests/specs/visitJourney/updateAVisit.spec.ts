import { test, expect } from '@playwright/test'
import { format, sub, addDays, eachDayOfInterval } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import VisitDetailsPage from '../../pages-playwright/visit/visitDetailsPage'
import SelectVisitorsPage from '../../pages-playwright/visitJourney/selectVisitorsPage'
import ConfirmUpdatePage from '../../pages-playwright/visit/confirmUpdatePage'
import SelectVisitDateAndTimePage from '../../pages-playwright/visitJourney/selectVisitDateAndTimePage'
import AdditionalSupportPage from '../../pages-playwright/visitJourney/additionalSupportPage'
import MainContactPage from '../../pages-playwright/visitJourney/mainContactPage'
import CheckYourBookingPage from '../../pages-playwright/visitJourney/checkYourBookingPage'
import ConfirmationPage from '../../pages-playwright/visitJourney/confirmationPage'
import RequestMethodPage from '../../pages-playwright/visitJourney/requestMethodPage'
import orchestrationApi from '../../mockApis/orchestration'
import prisonerContactRegistry from '../../mockApis/prisonerContactRegistry'
import { login, resetStubs } from '../../testUtils'
import { SessionsAndScheduleDto } from '../../../server/data/orchestrationApiTypes'

test.describe('Update a visit', () => {
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

  test.beforeEach(async () => {
    await resetStubs()
    await orchestrationApi.stubSupportedPrisonIds()
    await orchestrationApi.stubGetPrison()
    await orchestrationApi.stubGetNotificationCount({})
  })

  test('should complete the update a visit journey', async ({ page }) => {
    const dateIn7Days = format(addDays(today, 7), shortDateFormat)
    const dateIn8Days = format(addDays(today, 8), shortDateFormat)

    const eachDateUntilNextMonth = eachDayOfInterval({ start: today, end: addDays(today, 32) })

    const sessionsAndSchedule: SessionsAndScheduleDto[] = eachDateUntilNextMonth.map(date => ({
      date: format(date, shortDateFormat),
      visitSessions: [],
      scheduledEvents: [],
    }))

    sessionsAndSchedule.at(7).visitSessions = [
      TestData.visitSessionV2({ startTime: '10:00', endTime: '11:00', sessionTemplateReference: 'a' }),
    ]

    sessionsAndSchedule.at(8).visitSessions = [
      TestData.visitSessionV2({ startTime: '13:30', endTime: '15:00', sessionTemplateReference: 'b' }),
    ]

    const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({ sessionsAndSchedule })

    const session7Start = `${sessionsAndSchedule.at(7).date}T${sessionsAndSchedule.at(7).visitSessions[0].startTime}:00`
    const session7End = `${sessionsAndSchedule.at(7).date}T${sessionsAndSchedule.at(7).visitSessions[0].endTime}:00`
    const session7Ref = sessionsAndSchedule.at(7).visitSessions[0].sessionTemplateReference

    const session8Start = `${sessionsAndSchedule.at(8).date}T${sessionsAndSchedule.at(8).visitSessions[0].startTime}:00`
    const session8End = `${sessionsAndSchedule.at(8).date}T${sessionsAndSchedule.at(8).visitSessions[0].endTime}:00`
    const session8Ref = sessionsAndSchedule.at(8).visitSessions[0].sessionTemplateReference

    const originalVisit = TestData.visitBookingDetailsRaw({
      startTimestamp: session7Start,
      endTimestamp: session7End,
      sessionTemplateReference: session7Ref,
      visitors: [contacts[0]],
      visitorSupport: null,
    })

    await orchestrationApi.stubGetVisitDetailed(originalVisit)

    await login(page)
    // Visit details page
    await page.goto('/visit/ab-cd-ef-gh')

    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'booking')
    await expect(visitDetailsPage.visitReference).toContainText('ab-cd-ef-gh')
    await expect(visitDetailsPage.prisonerName).toContainText('John Smith')

    // Start update journey
    await prisonerContactRegistry.stubPrisonerSocialContacts({ offenderNo, contacts })
    await visitDetailsPage.updateBooking.click()

    // Select visitors page - existing visitor selected then add another
    const selectVisitorsPage = await SelectVisitorsPage.verifyOnPage(page)
    await expect(selectVisitorsPage.getVisitor(contacts[0].personId)).toBeChecked()
    await expect(selectVisitorsPage.getVisitor(contacts[1].personId)).not.toBeChecked()
    await selectVisitorsPage.getVisitor(contacts[1].personId).check()

    // Select date and time - current slot pre-selected
    await orchestrationApi.stubGetVisitSessionsAndSchedule({
      prisonerId: offenderNo,
      visitSessionsAndSchedule,
    })

    await selectVisitorsPage.continueButton.click()

    const dateTimePage = await SelectVisitDateAndTimePage.verifyOnPage(page)
    await expect(dateTimePage.getSessionLabel(dateIn7Days, 0)).toContainText('Original booking')

    // Select date and time - choose different time
    const updatedApplication = TestData.application({
      startTimestamp: session8Start,
      endTimestamp: session8End,
      visitContact: { telephone: '01234 567890', email: 'visitor@example.com', name: 'Jeanette Smith' },
      visitors: [
        { nomisPersonId: 4321, visitContact: true },
        { nomisPersonId: 4322, visitContact: false },
      ],
      visitorSupport: { description: '' },
      sessionTemplateReference: session8Ref,
    })

    await orchestrationApi.stubCreateVisitApplicationFromVisit({
      visitReference: originalVisit.reference,
      application: updatedApplication,
    })

    await dateTimePage.clickCalendarDay(dateIn8Days).click()
    const session = dateTimePage.selectSession(dateIn8Days, 0)
    await session.waitFor({ state: 'visible' })
    await session.click()
    await dateTimePage.continueButton.click()

    // Additional support - add details
    const supportPage = await AdditionalSupportPage.verifyOnPage(page)
    await supportPage.additionalSupportRequired.check()
    await supportPage.additionalSupportInput.fill('Wheelchair ramp, Some extra help!')
    await supportPage.continueButton.click()

    // Main contact - check pre-populated then change phone number
    const mainContactPage = await MainContactPage.verifyOnPage(page)
    await expect(mainContactPage.phoneNumberInput).toHaveValue(originalVisit.visitContact.telephone)
    await mainContactPage.phoneNumberInput.fill('09876 543 321')

    await orchestrationApi.stubChangeVisitApplication(
      TestData.application({
        startTimestamp: session8Start,
        endTimestamp: session8End,
        visitContact: {
          name: 'Jeanette Smith',
          telephone: '09876 543 321',
        },
        visitors: [
          { nomisPersonId: contacts[0].personId, visitContact: true },
          { nomisPersonId: contacts[1].personId, visitContact: false },
        ],
        visitorSupport: { description: 'Wheelchair ramp, Some extra help!' },
        sessionTemplateReference: session8Ref,
      }),
    )

    await mainContactPage.continueButton.click()
    // Request method
    const requestMethodPage = await RequestMethodPage.verifyOnPage(page)
    await expect(requestMethodPage.getRequestLabelByValue('PHONE')).toContainText('Phone call')
    await requestMethodPage.getRequestMethodByValue('PHONE').check()
    await requestMethodPage.continueButton.click()

    // Check your booking page
    const checkPage = await CheckYourBookingPage.verifyOnPage(page)
    await expect(checkPage.visitDate).toContainText(format(dateIn8Days, longDateFormat))
    await expect(checkPage.visitTime).toContainText('1:30pm to 3pm')
    await expect(checkPage.mainContactNumber).toContainText('09876 543 321')
    await orchestrationApi.stubUpdateVisit({
      visit: TestData.visit({
        visitStatus: 'BOOKED',
        startTimestamp: session8Start,
        endTimestamp: session8End,
      }),
      applicationMethod: 'PHONE',
      username: 'USER1',
      allowOverBooking: false,
      visitorDetails: [
        { visitorId: contacts[0].personId, visitorAge: 18 },
        { visitorId: contacts[1].personId, visitorAge: 5 },
      ],
    })

    await checkPage.submitButton.click()
    // Confirmation page
    const confirmationPage = await ConfirmationPage.verifyOnPage(page, 'Visit updated')
    await expect(confirmationPage.visitDate).toContainText(format(dateIn8Days, longDateFormat))
    await expect(confirmationPage.mainContactNumber).toContainText('09876 543 321')
    await expect(confirmationPage.mainContactName).toContainText('Jeanette Smith (wife of the prisoner)')
    await expect(confirmationPage.additionalSupport).toContainText('Wheelchair ramp, Some extra help!')
    await expect(confirmationPage.visitorName(1)).toContainText('Jeanette Smith (wife of the prisoner)')
    await expect(confirmationPage.visitorName(2)).toContainText('Bob Smith (son of the prisoner)')
    await expect(confirmationPage.visitType).toContainText('Open')
    await expect(confirmationPage.prisonerName).toContainText('John Smith')
    await expect(confirmationPage.prisonerNumber).toContainText(offenderNo)
    await expect(confirmationPage.visitTime).toContainText('1:30pm to 3pm')
  })

  test('should redirect to confirm update page if outside booking window limit', async ({ page }) => {
    const originalVisit = TestData.visitBookingDetailsRaw({
      startTimestamp: format(addDays(today, 1), `${shortDateFormat}'T'10:00:00`),
      endTimestamp: format(addDays(today, 1), `${shortDateFormat}'T'11:00:00`),
      visitorSupport: null,
    })

    await orchestrationApi.stubGetVisitDetailed(originalVisit)

    await login(page)
    // Visit details page
    await page.goto('/visit/ab-cd-ef-gh')

    const visitDetailsPage = await VisitDetailsPage.verifyOnPage(page, 'booking')
    await expect(visitDetailsPage.visitReference).toContainText('ab-cd-ef-gh')

    // Start update journey
    await prisonerContactRegistry.stubPrisonerSocialContacts({ offenderNo, contacts })
    await visitDetailsPage.updateBooking.click()

    // Confirm update page - check yes
    const confirmUpdatePage = await ConfirmUpdatePage.verifyOnPage(page)
    await confirmUpdatePage.confirmUpdateYesRadio.check()
    await confirmUpdatePage.submitButton.click()

    // Select visitors page - existing visitor selected then add another
    const selectVisitorsPage = await SelectVisitorsPage.verifyOnPage(page)
    await expect(selectVisitorsPage.getVisitor(contacts[0].personId)).toBeChecked()
    await expect(selectVisitorsPage.getVisitor(contacts[1].personId)).not.toBeChecked()
  })
})
