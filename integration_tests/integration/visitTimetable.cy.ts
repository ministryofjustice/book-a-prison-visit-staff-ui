import { addDays, format, isMonday, previousMonday, sub } from 'date-fns'
import { SessionSchedule } from '../../server/data/visitSchedulerApiTypes'
import HomePage from '../pages/home'
import Page from '../pages/page'

context('Book a visit', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  let sessionSchedule: SessionSchedule[] = []

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisons')
    cy.signIn()
  })

  it('should show the visits timetable for Monday of the current week when there are no sessions', () => {
    const prisonId = 'HEI'

    const today = new Date()
    const thisMonday = isMonday(today) ? today : previousMonday(today)
    const sessionDate = format(thisMonday, shortDateFormat)

    cy.task('stubSessionSchedule', { prisonId, sessionDate, sessionSchedule })

    // Home page - select View visit timetable
    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewTimetableTile().click()
  })
})
