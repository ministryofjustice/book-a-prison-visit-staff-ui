import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, FlashData, flashProvider, user } from '../testutils/appSetup'
import { createMockAuditService, createMockBookerService } from '../../services/testutils/mocks'
import bapvUserRoles from '../../constants/bapvUserRoles'
import TestData from '../testutils/testData'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const auditService = createMockAuditService()
const bookerService = createMockBookerService()

const booker = TestData.bookerDetailedInfo()
const prisoner = TestData.bookerPrisoner()
const url = `/manage-bookers/${booker.reference}/prisoner/${prisoner.prisonerNumber}/link-visitor`
const fakeDateTime = new Date('2025-10-01T09:00')

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDateTime) })

  flashData = { errors: [] }
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

describe('Booker management - approved visitor list', () => {
  describe(`GET ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService } })
      return request(app).get(url).expect(302).expect('location', '/authError')
    })

    it('should render non-linked approved visitor list page and save data to session', () => {
      const socialContact = TestData.socialContact()
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getNonLinkedSocialContacts.mockResolvedValue([socialContact])

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Link a visitor -/)
          expect($('.govuk-breadcrumbs li').length).toBe(0)
          expect($('.govuk-back-link').attr('href')).toBe(`/manage-bookers/${booker.reference}/booker-details`)
          expect($('h1').text().trim()).toBe('Link a visitor')

          // Visitor list
          expect($('[data-test=no-dob-warning]').length).toBe(0)
          expect($('[data-test=visitor-1-select] input').val()).toBe('4321')
          expect($('[data-test=visitor-1-name]').text()).toBe('Jeanette Smith')
          expect($('[data-test=visitor-1-dob]').text()).toBe('28 July 1986 (39 years old)')
          expect($('[data-test=visitor-1-last-visit]').text()).toBe('11 October 2025')

          expect($('[data-test=link-visitor]').parent('form').attr('action')).toBe(
            `/manage-bookers/${booker.reference}/prisoner/${prisoner.prisonerNumber}/link-visitor`,
          )
          expect($('[data-test=link-visitor]').text().trim()).toBe('Link the selected visitor')

          expect(bookerService.getBookerDetails).toHaveBeenCalledWith({
            username: 'user1',
            reference: booker.reference,
          })
          expect(bookerService.getNonLinkedSocialContacts).toHaveBeenCalledWith({
            username: 'user1',
            reference: booker.reference,
            prisonerId: prisoner.prisonerNumber,
          })

          expect(sessionData.bookerLinkVisitor).toStrictEqual({
            reference: booker.reference,
            prisonerId: prisoner.prisonerNumber,
            nonLinkedContacts: [socialContact],
          })
        })
    })

    it('should render non-linked approved visitor list page - with missing DoB warning', () => {
      const socialContact = TestData.socialContact({ dateOfBirth: null, lastApprovedForVisitDate: null })
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getNonLinkedSocialContacts.mockResolvedValue([socialContact])

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Visitor list
          expect($('[data-test=no-dob-warning]').text()).toContain('must have a date of birth')
          expect($('[data-test=visitor-1-select] input').length).toBe(0)
          expect($('[data-test=visitor-1-name]').text()).toBe('Jeanette Smith')
          expect($('[data-test=visitor-1-dob]').text()).toBe('Not entered')
          expect($('[data-test=visitor-1-last-visit]').text()).toBe('None')
        })
    })

    it('should render validation errors', () => {
      const socialContact = TestData.socialContact()
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getNonLinkedSocialContacts.mockResolvedValue([socialContact])

      flashData.errors = <FieldValidationError[]>[{ msg: 'Select a visitor to link', path: 'visitorId' }]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Link a visitor -/)
          expect($('.govuk-error-summary__body').text()).toContain('Select a visitor to link')
          expect($('#visitorId-error').text()).toContain('Select a visitor to link')
        })
    })
  })

  describe(`POST ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService } })
      return request(app).post(url).expect(302).expect('location', '/authError')
    })

    it('should redirect to link visitor notify page for selected visitor', () => {
      return request(app)
        .post(url)
        .send({ visitorId: '4321' })
        .expect(302)
        .expect('location', '/manage-bookers/aaaa-bbbb-cccc/prisoner/A1234BC/link-visitor/4321/notify')
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
        })
    })

    it('should set validation error if no visitor selected and redirect to original page', () => {
      return request(app)
        .post(url)
        .send({})
        .expect(302)
        .expect('location', '/manage-bookers/aaaa-bbbb-cccc/prisoner/A1234BC/link-visitor')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'Select a visitor to link', path: 'visitorId', type: 'field', value: undefined },
          ])
        })
    })

    it('should redirect to booker details if prisoner ID not valid', () => {
      const invalidUrl = `/manage-bookers/${booker.reference}/prisoner/${prisoner.prisonerNumber}X/link-visitor`
      return request(app)
        .post(invalidUrl)
        .send({})
        .expect(302)
        .expect('location', '/manage-bookers/aaaa-bbbb-cccc/booker-details')
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
        })
    })
  })
})
