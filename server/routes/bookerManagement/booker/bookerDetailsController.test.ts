import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, FlashData, flashProvider, user } from '../../testutils/appSetup'
import { createMockAuditService, createMockBookerService } from '../../../services/testutils/mocks'
import bapvUserRoles from '../../../constants/bapvUserRoles'
import TestData from '../../testutils/testData'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const auditService = createMockAuditService()
const bookerService = createMockBookerService()

const bookerReference = TestData.bookerSearchResult().reference
const url = `/manage-bookers/${bookerReference}/booker-details`
const fakeDateTime = new Date('2025-10-01T09:00')

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDateTime) })

  flashData = { messages: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  sessionData = {} as SessionData

  app = appWithAllRoutes({
    services: { auditService, bookerService },
    userSupplier: () => ({ ...user, userRoles: [bapvUserRoles.BOOKER_ADMIN] }),
    sessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('Booker management - booker details', () => {
  describe(`GET ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService } })
      return request(app).get(url).expect(302).expect('location', '/authError')
    })

    it('should reject an invalid booker reference', () => {
      return request(app).get('/manage-bookers/INVALID-BOOKER-REFERENCE/booker-details').expect(400)
    })

    it('should render booker details page - booker with single prisoner and visitors', () => {
      const booker = TestData.bookerDetailedInfo()
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getBookerStatus.mockResolvedValue({ active: true, emailHasMultipleAccounts: false })

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Booker details -/)
          expect($('.govuk-breadcrumbs li').length).toBe(0)
          expect($('.govuk-back-link').attr('href')).toBe('/manage-bookers')
          expect($('.moj-alert').length).toBe(0)
          expect($('h1').text().trim()).toBe('Booker details')

          // Booker details
          expect($('[data-test=booker-email]').text()).toBe(booker.email)
          expect($('[data-test=booker-reference]').text()).toBe(booker.reference)

          // Prisoner and visitors
          expect($('[data-test=prisoner-1]').text()).toBe('Visits to John Smith (A1234BC) at Hewell (HMP)')
          expect($('[data-test=prisoner-1-visitor-1-name]').text()).toBe('Jeanette Smith')
          expect($('[data-test=prisoner-1-visitor-1-relationship]').text()).toBe('Wife')
          expect($('[data-test=prisoner-1-visitor-1-dob]').text()).toBe('28 July 1986 (39 years old)')
          expect($('[data-test=prisoner-1-visitor-1-unlink]').text().trim()).toBe('Unlink Jeanette Smith')
          expect($('[data-test=prisoner-1-visitor-1-unlink]').parent('form').attr('action')).toBe(
            '/manage-bookers/aaaa-bbbb-cccc/prisoner/A1234BC/visitor/4321/unlink',
          )

          // Link visitor
          expect($('[data-test=prisoner-1-link-visitor]').text().trim()).toBe('Link a visitor')
          expect($('[data-test=prisoner-1-link-visitor]').attr('href')).toBe(
            '/manage-bookers/aaaa-bbbb-cccc/prisoner/A1234BC/link-visitor',
          )

          expect(bookerService.getBookerDetails).toHaveBeenCalledWith({
            username: 'user1',
            reference: booker.reference,
          })
          expect(bookerService.getBookerStatus).toHaveBeenCalledWith({
            username: 'user1',
            email: booker.email,
            reference: booker.reference,
          })
          expect(auditService.viewBooker).toHaveBeenCalledWith({
            reference: booker.reference,
            prisonerIds: [booker.permittedPrisoners[0].prisoner.prisonerNumber],
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should render any alert messages set in flash', () => {
      const booker = TestData.bookerDetailedInfo()
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getBookerStatus.mockResolvedValue({ active: true, emailHasMultipleAccounts: false })

      flashData.messages = [TestData.mojAlert({ title: 'test alert message' })]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.moj-alert').length).toBe(1)
          expect($('.moj-alert').text()).toContain('test alert message')
        })
    })

    it('should render booker details page - booker with multiple prisoners', () => {
      const booker = TestData.bookerDetailedInfo({
        permittedPrisoners: [
          {
            prisoner: TestData.bookerPrisoner(),
            registeredPrison: TestData.bookerPrisonerRegisteredPrison(),
            permittedVisitors: [TestData.bookerPrisonerVisitor()],
          },
          {
            prisoner: TestData.bookerPrisoner({ firstName: 'FRED', prisonerNumber: 'B4567DE' }),
            registeredPrison: TestData.bookerPrisonerRegisteredPrison({
              prisonCode: 'BLI',
              prisonName: 'Bristol (HMP)',
            }),
            permittedVisitors: [
              TestData.bookerPrisonerVisitor({ visitorId: 4322, firstName: 'Alice', dateOfBirth: '1990-07-23' }),
            ],
          },
        ],
      })
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getBookerStatus.mockResolvedValue({ active: true, emailHasMultipleAccounts: false })

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          // Prisoner #1
          // Prisoner and visitors
          expect($('[data-test=prisoner-1]').text()).toBe('Visits to John Smith (A1234BC) at Hewell (HMP)')
          expect($('[data-test=prisoner-1-visitor-1-name]').text()).toBe('Jeanette Smith')
          expect($('[data-test=prisoner-1-visitor-1-relationship]').text()).toBe('Wife')
          expect($('[data-test=prisoner-1-visitor-1-dob]').text()).toBe('28 July 1986 (39 years old)')
          expect($('[data-test=prisoner-1-visitor-1-unlink]').parent('form').attr('action')).toBe(
            '/manage-bookers/aaaa-bbbb-cccc/prisoner/A1234BC/visitor/4321/unlink',
          )
          // Link visitor
          expect($('[data-test=prisoner-1-link-visitor]').text().trim()).toBe('Link a visitor for John Smith')
          expect($('[data-test=prisoner-1-link-visitor]').attr('href')).toBe(
            '/manage-bookers/aaaa-bbbb-cccc/prisoner/A1234BC/link-visitor',
          )

          // Prisoner #2
          // Prisoner and visitors
          expect($('[data-test=prisoner-2]').text()).toBe('Visits to Fred Smith (B4567DE) at Bristol (HMP)')
          expect($('[data-test=prisoner-2-visitor-1-name]').text()).toBe('Alice Smith')
          expect($('[data-test=prisoner-2-visitor-1-relationship]').text()).toBe('Wife')
          expect($('[data-test=prisoner-2-visitor-1-dob]').text()).toBe('23 July 1990 (35 years old)')
          expect($('[data-test=prisoner-2-visitor-1-unlink]').parent('form').attr('action')).toBe(
            '/manage-bookers/aaaa-bbbb-cccc/prisoner/B4567DE/visitor/4322/unlink',
          )
          // Link visitor
          expect($('[data-test=prisoner-2-link-visitor]').text().trim()).toBe('Link a visitor for Fred Smith')
          expect($('[data-test=prisoner-2-link-visitor]').attr('href')).toBe(
            '/manage-bookers/aaaa-bbbb-cccc/prisoner/B4567DE/link-visitor',
          )

          expect(bookerService.getBookerDetails).toHaveBeenCalledWith({
            username: 'user1',
            reference: booker.reference,
          })
          expect(bookerService.getBookerStatus).toHaveBeenCalledWith({
            username: 'user1',
            email: booker.email,
            reference: booker.reference,
          })
        })
    })

    it('should render booker details page - booker with multiple prisoners', () => {
      const booker = TestData.bookerDetailedInfo({
        permittedPrisoners: [
          {
            prisoner: TestData.bookerPrisoner(),
            registeredPrison: TestData.bookerPrisonerRegisteredPrison(),
            permittedVisitors: [TestData.bookerPrisonerVisitor()],
          },
          {
            prisoner: TestData.bookerPrisoner({ firstName: 'FRED', prisonerNumber: 'B4567DE' }),
            registeredPrison: TestData.bookerPrisonerRegisteredPrison({
              prisonCode: 'BLI',
              prisonName: 'Bristol (HMP)',
            }),
            permittedVisitors: [
              TestData.bookerPrisonerVisitor({ visitorId: 4322, firstName: 'Alice', dateOfBirth: '1990-07-23' }),
            ],
          },
        ],
      })
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getBookerStatus.mockResolvedValue({ active: true, emailHasMultipleAccounts: false })

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          // Prisoner #1
          // Prisoner and visitors
          expect($('[data-test=prisoner-1]').text()).toBe('Visits to John Smith (A1234BC) at Hewell (HMP)')
          expect($('[data-test=prisoner-1-visitor-1-name]').text()).toBe('Jeanette Smith')
          expect($('[data-test=prisoner-1-visitor-1-relationship]').text()).toBe('Wife')
          expect($('[data-test=prisoner-1-visitor-1-dob]').text()).toBe('28 July 1986 (39 years old)')
          expect($('[data-test=prisoner-1-visitor-1-unlink]').parent('form').attr('action')).toBe(
            '/manage-bookers/aaaa-bbbb-cccc/prisoner/A1234BC/visitor/4321/unlink',
          )
          // Link visitor
          expect($('[data-test=prisoner-1-link-visitor]').text().trim()).toBe('Link a visitor for John Smith')
          expect($('[data-test=prisoner-1-link-visitor]').attr('href')).toBe(
            '/manage-bookers/aaaa-bbbb-cccc/prisoner/A1234BC/link-visitor',
          )

          // Prisoner #2
          // Prisoner and visitors
          expect($('[data-test=prisoner-2]').text()).toBe('Visits to Fred Smith (B4567DE) at Bristol (HMP)')
          expect($('[data-test=prisoner-2-visitor-1-name]').text()).toBe('Alice Smith')
          expect($('[data-test=prisoner-2-visitor-1-relationship]').text()).toBe('Wife')
          expect($('[data-test=prisoner-2-visitor-1-dob]').text()).toBe('23 July 1990 (35 years old)')
          expect($('[data-test=prisoner-2-visitor-1-unlink]').parent('form').attr('action')).toBe(
            '/manage-bookers/aaaa-bbbb-cccc/prisoner/B4567DE/visitor/4322/unlink',
          )
          // Link visitor
          expect($('[data-test=prisoner-2-link-visitor]').text().trim()).toBe('Link a visitor for Fred Smith')
          expect($('[data-test=prisoner-2-link-visitor]').attr('href')).toBe(
            '/manage-bookers/aaaa-bbbb-cccc/prisoner/B4567DE/link-visitor',
          )
        })
    })

    it('should render booker details page - booker with no prisoners', () => {
      const booker = TestData.bookerDetailedInfo({ permittedPrisoners: [] })
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getBookerStatus.mockResolvedValue({ active: true, emailHasMultipleAccounts: false })

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=booker-no-prisoners]').text()).toContain('booker has no prisoners')
        })
    })

    it('should render booker details page - booker with single prisoner and no visitors', () => {
      const booker = TestData.bookerDetailedInfo({
        permittedPrisoners: [
          {
            prisoner: TestData.bookerPrisoner(),
            registeredPrison: TestData.bookerPrisonerRegisteredPrison(),
            permittedVisitors: [],
          },
        ],
      })
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getBookerStatus.mockResolvedValue({ active: true, emailHasMultipleAccounts: false })

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Prisoner and no visitors message
          expect($('[data-test=prisoner-1]').text()).toBe('Visits to John Smith (A1234BC) at Hewell (HMP)')
          expect($('[data-test=prisoner-1-no-visitors]').text()).toContain('no linked visitors')

          expect($('[data-test=prisoner-1-link-visitor]').text().trim()).toBe('Link a visitor')
          expect($('[data-test=prisoner-1-link-visitor]').attr('href')).toBe(
            '/manage-bookers/aaaa-bbbb-cccc/prisoner/A1234BC/link-visitor',
          )
        })
    })

    it('should render booker details page - active booker when multiple accounts for email', () => {
      const booker = TestData.bookerDetailedInfo()
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getBookerStatus.mockResolvedValue({ active: true, emailHasMultipleAccounts: true })
      sessionData.matchedBookers = [TestData.bookerSearchResult(), TestData.bookerSearchResult()]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Back link (to select account page)
          expect($('.govuk-back-link').attr('href')).toBe('/manage-bookers/select-account')
          // Message
          expect($('.moj-alert').text()).toContain('This account is active')
        })
    })

    it('should render booker details page - inactive booker when multiple accounts for email', () => {
      const booker = TestData.bookerDetailedInfo()
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getBookerStatus.mockResolvedValue({ active: false, emailHasMultipleAccounts: true })

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Message
          expect($('.moj-alert').text()).toContain('This account is inactive')

          // Prisoner and visitors (with no 'Unlink' action)
          expect($('[data-test=prisoner-1]').text()).toBe('Visits to John Smith (A1234BC) at Hewell (HMP)')
          expect($('[data-test=prisoner-1-visitor-1-name]').text()).toBe('Jeanette Smith')
          expect($('[data-test=prisoner-1-visitor-1-relationship]').text()).toBe('Wife')
          expect($('[data-test=prisoner-1-visitor-1-dob]').text()).toBe('28 July 1986 (39 years old)')
          expect($('[data-test=prisoner-1-visitor-1-action]').length).toBe(0)

          // Link visitor - no button
          expect($('[data-test=prisoner-1-link-visitor]').length).toBe(0)
        })
    })
  })
})
