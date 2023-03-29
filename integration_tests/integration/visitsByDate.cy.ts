import { format } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VisitsByDatePage from '../pages/visitsByDate'

context('View visit schedule timetable', () => {
  const shortDateFormat = 'yyyy-MM-dd'
  const prisonerNumber1 = 'A1234BC'
  const prisonerNumber2 = 'A1592EC'
  const today = new Date()
  const visits = [
    TestData.visit({ reference: 'ab-cd-ef-gh', prisonerId: prisonerNumber1 }),
    TestData.visit({ reference: 'gh-ef-cd-ab', prisonerId: prisonerNumber2 }),
  ]
  const prisonerNumbers = [visits[0].prisonerId, visits[1].prisonerId]
  const prisonId = 'HEI'

  const dateString = format(today, shortDateFormat)

  const startDateTime = `${dateString}T00:00:00`
  const endDateTime = `${dateString}T23:59:59`

  const sessionStartTime = '10:00:00'
  const sessionEndTime = '11:00:00'

  const sessionCapacity = TestData.sessionCapacity()

  const results = [
    {
      lastName: 'lastName1',
      firstName: 'firstName1',
      prisonerNumber: prisonerNumber1,
      dateOfBirth: '2000-01-01',
    },
    {
      lastName: 'lastName2',
      firstName: 'firstName2',
      prisonerNumber: prisonerNumber2,
      dateOfBirth: '2000-01-02',
    },
  ]
  const contacts = [
    TestData.contact(),
    TestData.contact({
      personId: 4322,
      firstName: 'Bob',
      relationshipCode: 'SON',
      relationshipDescription: 'Son',
    }),
  ]

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubPrisons')
    cy.signIn()
  })

  it('should show the visits timetable with the current day selected', () => {
    // Home page - select View visit timetable
    const homePage = Page.verifyOnPage(HomePage)

    cy.task('stubVisitsByDate', {
      startDateTime,
      endDateTime,
      prisonId,
      visits,
    })

    cy.task('stubGetPrisonersByPrisonerNumbers', {
      prisonerNumbers,
      results,
    })
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerNumber1, contacts })
    cy.task('stubPrisonerSocialContacts', { offenderNo: prisonerNumber2, contacts })

    cy.task('stubVisitSessionCapacity', {
      prisonId,
      sessionDate: dateString,
      sessionStartTime,
      sessionEndTime,
      sessionCapacity,
    })

    homePage.viewVisitsTile().click()

    Page.verifyOnPage(VisitsByDatePage)
  })
})
