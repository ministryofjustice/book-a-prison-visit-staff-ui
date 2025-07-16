import { format, add } from 'date-fns'
import TestData from '../../../server/routes/testutils/testData'
import Page from '../../pages/page'
import VisitDetailsPage from '../../pages/visit/visitDetails'
import CancelVisitPage from '../../pages/visit/cancelVisit'
import VisitCancelledPage from '../../pages/visit/visitCancelled'
import HomePage from '../../pages/home'
import { CancelVisitOrchestrationDto } from '../../../server/data/orchestrationApiTypes'

context('Cancel visit journey', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'd MMMM yyyy'

  const today = new Date()

  const futureVisitDate = format(add(today, { months: 1 }), shortDateFormat)
  const visitDetails = TestData.visitBookingDetailsRaw({
    startTimestamp: `${futureVisitDate}T12:00:00`,
    endTimestamp: `${futureVisitDate}T14:00:00`,
  })
  const visit = TestData.visit({
    startTimestamp: `${futureVisitDate}T12:00:00`,
    endTimestamp: `${futureVisitDate}T14:00:00`,
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()

    cy.task('stubGetVisitDetailed', visitDetails)
  })

  it('should cancel a visit', () => {
    const cancelVisitDto: CancelVisitOrchestrationDto = {
      cancelOutcome: {
        outcomeStatus: 'ESTABLISHMENT_CANCELLED',
        text: 'Overbooking error',
      },
      applicationMethodType: 'NOT_APPLICABLE',
      actionedBy: 'USER1',
      userType: 'STAFF',
    }

    cy.visit('/visit/ab-cd-ef-gh')

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.cancelBooking().click()

    const cancelVisitPage = Page.verifyOnPage(CancelVisitPage)
    cancelVisitPage.establishmentCancelledRadio().click()
    cancelVisitPage.enterCancellationReasonText(cancelVisitDto.cancelOutcome.text)

    cy.task('stubCancelVisit', { visit, cancelVisitDto })
    cancelVisitPage.submit().click()

    const visitCancelledPage = Page.verifyOnPage(VisitCancelledPage)
    visitCancelledPage.visitDetails().contains(format(new Date(futureVisitDate), longDateFormat))
    visitCancelledPage.homeButton().click()

    Page.verifyOnPage(HomePage)
  })

  it('should cancel a visit with request method captured when VISITOR_CANCELLED', () => {
    const cancelVisitDto: CancelVisitOrchestrationDto = {
      cancelOutcome: {
        outcomeStatus: 'VISITOR_CANCELLED',
        text: 'Illness',
      },
      applicationMethodType: 'WEBSITE',
      actionedBy: 'USER1',
      userType: 'STAFF',
    }

    cy.visit('/visit/ab-cd-ef-gh')

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitReference().contains('ab-cd-ef-gh')
    visitDetailsPage.cancelBooking().click()

    const cancelVisitPage = Page.verifyOnPage(CancelVisitPage)
    cancelVisitPage.visitorCancelledRadio().click()
    cancelVisitPage.enterCancellationReasonText(cancelVisitDto.cancelOutcome.text)
    cancelVisitPage.getRequestMethodByValue('WEBSITE').check()

    cy.task('stubCancelVisit', { visit, cancelVisitDto })
    cancelVisitPage.submit().click()

    const visitCancelledPage = Page.verifyOnPage(VisitCancelledPage)
    visitCancelledPage.visitDetails().contains(format(new Date(futureVisitDate), longDateFormat))
    visitCancelledPage.homeButton().click()

    Page.verifyOnPage(HomePage)
  })
})
