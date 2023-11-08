import { format, sub, add } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VisitsByDatePage from '../pages/visitsByDate'

context('View visit schedule timetable', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const longDateFormat = 'EEEE d MMMM yyyy'

  const today = new Date()
  const todayShortString = format(today, shortDateFormat)
  const todayLongString = format(today, longDateFormat)
  const tomorrowShortString = format(add(today, { days: 1 }), shortDateFormat)
  const tomorrowLongString = format(add(today, { days: 1 }), longDateFormat)

  const prisonerNumber1 = 'A1234BC'
  const prisonerNumber2 = 'A1592EC'

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

  const prisonId = 'HEI'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisonNames')
    cy.task('stubGetNotificationCount', {})
    cy.signIn()
  })

  it('Should show visits by date, and change view to tomorrow', () => {
    const homePage = Page.verifyOnPage(HomePage)

    let startDateTime = `${todayShortString}T00:00:00`
    let endDateTime = `${todayShortString}T23:59:59`
    let visits = [
      TestData.visit({ reference: 'ab-cd-ef-gh', prisonerId: prisonerNumber1 }),
      TestData.visit({ reference: 'gh-ef-cd-ab', prisonerId: prisonerNumber2 }),
    ]
    cy.task('stubVisitsByDate', {
      startDateTime,
      endDateTime,
      prisonId,
      visits,
    })

    let prisonerNumbers = [prisonerNumber1, prisonerNumber2]
    let prisonersResults = [
      {
        lastName: 'Smith',
        firstName: 'Jack',
        prisonerNumber: prisonerNumber1,
        dateOfBirth: '2000-01-01',
      },
      {
        lastName: 'Smith',
        firstName: 'Philip',
        prisonerNumber: prisonerNumber2,
        dateOfBirth: '2000-01-02',
      },
    ]
    cy.task('stubGetPrisonersByPrisonerNumbers', {
      prisonerNumbers,
      results: prisonersResults,
    })

    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerNumber1, contacts })
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerNumber2, contacts })

    const sessionStartTime = '10:00:00'
    const sessionEndTime = '11:00:00'
    let sessionCapacity = TestData.sessionCapacity()
    cy.task('stubVisitSessionCapacity', {
      prisonId,
      sessionDate: todayShortString,
      sessionStartTime,
      sessionEndTime,
      sessionCapacity,
    })

    homePage.viewVisitsTile().click()

    const visitsByDatePage = Page.verifyOnPage(VisitsByDatePage)

    visitsByDatePage.today().contains(todayLongString)
    visitsByDatePage.tomorrow().contains(tomorrowLongString)

    visitsByDatePage.today().should('have.attr', 'aria-current', 'page')
    visitsByDatePage.tomorrow().should('not.have.attr', 'aria-current', 'page')

    visitsByDatePage.tablesBookedCount().contains('2 of 30 tables booked')
    visitsByDatePage.visitorsTotalCount().contains('4 visitors')
    visitsByDatePage.adultVisitorsCount().contains('2 adults')
    visitsByDatePage.childVisitorsCount().contains('2 children')

    visitsByDatePage.prisonerRowOneName().contains(`${prisonersResults[0].lastName}, ${prisonersResults[0].firstName}`)
    visitsByDatePage.prisonerRowOneNumber().contains(prisonerNumber1)
    visitsByDatePage.prisonerRowTwoName().contains(`${prisonersResults[1].lastName}, ${prisonersResults[1].firstName}`)
    visitsByDatePage.prisonerRowTwoNumber().contains(prisonerNumber2)

    startDateTime = `${tomorrowShortString}T00:00:00`
    endDateTime = `${tomorrowShortString}T23:59:59`
    visits = [
      TestData.visit({ reference: 'ab-cd-ef-gh', prisonerId: prisonerNumber1, visitRestriction: 'CLOSED' }),
      TestData.visit({ reference: 'gh-ef-cd-ab', prisonerId: prisonerNumber2 }),
    ]
    cy.task('stubVisitsByDate', {
      startDateTime,
      endDateTime,
      prisonId,
      visits,
    })

    prisonerNumbers = [prisonerNumber2]
    prisonersResults = [
      {
        lastName: 'Smith',
        firstName: 'Philip',
        prisonerNumber: prisonerNumber2,
        dateOfBirth: '2000-01-02',
      },
    ]
    cy.task('stubGetPrisonersByPrisonerNumbers', {
      prisonerNumbers,
      results: prisonersResults,
    })

    sessionCapacity = TestData.sessionCapacity({ open: 20, closed: 1 })
    cy.task('stubVisitSessionCapacity', {
      prisonId,
      sessionDate: tomorrowShortString,
      sessionStartTime,
      sessionEndTime,
      sessionCapacity,
    })

    visitsByDatePage.tomorrow().click()

    visitsByDatePage.today().should('not.have.attr', 'aria-current', 'page')
    visitsByDatePage.tomorrow().should('have.attr', 'aria-current', 'page')

    visitsByDatePage.tablesBookedCount().contains('1 of 20 tables booked')
    visitsByDatePage.visitType().contains('Open')

    visitsByDatePage.prisonerRowOneName().contains(`${prisonersResults[0].lastName}, ${prisonersResults[0].firstName}`)
    visitsByDatePage.prisonerRowOneNumber().contains(prisonerNumber2)
    visitsByDatePage.prisonerRowTwoName().should('not.exist')
    visitsByDatePage.prisonerRowTwoNumber().should('not.exist')
  })
})
