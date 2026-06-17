import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { BadRequest, InternalServerError } from 'http-errors'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockAuditService, createMockVisitService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import { setFeature } from '../../data/testutils/mockFeature'

let app: Express

const auditService = createMockAuditService()
const visitService = createMockVisitService()

const fakeDate = new Date('2026-05-20T11:00:00')

beforeEach(() => {
  setFeature('printVisitPasses', true)

  jest.useFakeTimers({ advanceTimers: true, now: fakeDate })
  app = appWithAllRoutes({ services: { auditService, visitService } })
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('Print visit passes by date', () => {
  const date = '2026-05-20'
  const url = `/visit-passes?date=${date}&from=visits&query=back-link-query`

  // Adult visitors
  const visitPassAdultVisitor1 = TestData.visitPassDtoVisitor({ firstName: 'Adult', lastName: 'One' })
  const visitPassAdultVisitor2 = TestData.visitPassDtoVisitor({ firstName: 'Adult', lastName: 'Two' })

  // Child (Under 16) visitors
  const visitPassChildVisitor1 = TestData.visitPassDtoVisitor({
    firstName: 'Child',
    lastName: 'One',
    dateOfBirth: '2020-01-01',
  })
  const visitPassChildVisitor2 = TestData.visitPassDtoVisitor({
    firstName: 'Child',
    lastName: 'Two',
    dateOfBirth: '2026-02-01',
  })
  const visitPassChildVisitor3 = TestData.visitPassDtoVisitor({
    firstName: 'Child',
    lastName: 'Three',
    dateOfBirth: '2026-04-01',
  })

  // Visit with adults only
  const visitPass1 = TestData.visitPassDto({ visitors: [visitPassAdultVisitor1, visitPassAdultVisitor2] })

  // Visit with adults and children
  const visitPass2 = TestData.visitPassDto({
    reference: 'bc-de-fg-hi',
    visitDate: '2026-06-01',
    startTime: '14:00',
    endTime: '15:30',
    prisonerId: 'B1234CD',
    prisonerFirstName: 'BOB',
    prisonerLastName: 'JONES',
    visitRestriction: 'CLOSED',
    visitors: [visitPassAdultVisitor1, visitPassChildVisitor1, visitPassChildVisitor2, visitPassChildVisitor3],
  })

  describe('GET /visit-passes', () => {
    it('should return a 404 if the feature is not enabled', () => {
      setFeature('printVisitPasses', false)
      app = appWithAllRoutes({ services: { auditService, visitService } })
      return request(app).get(url).expect(404)
    })

    it('should render visit passes page for given date and selected establishment', () => {
      const visitPasses = [visitPass1, visitPass2]
      visitService.getVisitPasses.mockResolvedValue(visitPasses)

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Print visit passes -/)
          expect($('.govuk-back-link').attr('href')).toBe(`/visits?back-link-query`)
          expect($('h1').eq(0).text().trim()).toBe('Print visit passes')
          expect($('[data-test="print-all"]').length).toBe(1)

          expect($('.visit-pass').length).toBe(2)

          // Visit pass 1
          expect($('[data-test="visit-1-prison-name"]').text()).toBe('Hewell (HMP)')
          expect($('[data-test="visit-1-date"]').text()).toBe('Monday 1 June 2026')
          expect($('[data-test="visit-1-time"]').text()).toBe('10am to 11am')
          expect($('[data-test="visit-1-prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="visit-1-prison-number"]').text()).toBe('A1234BC')
          expect($('[data-test="visit-1-reference"]').text()).toBe('ab-cd-ef-gh')
          expect($('[data-test="visit-1-visit-type"]').text()).toBe('Open')
          expect($('[data-test="visit-1-visitor-1"]').text()).toContain('Adult One')
          expect($('[data-test="visit-1-visitor-1"]').text()).toContain(
            '23B, Premises, 123 The Street, Coventry, C1 2AB',
          )
          expect($('[data-test="visit-1-visitor-2"]').text()).toContain('Adult Two')
          expect($('[data-test="visit-1-pass-created-date"]').text()).toBe('Wednesday 20 May 2026 at 11:00am')

          // Visit pass 2
          expect($('[data-test="visit-2-prison-name"]').text()).toBe('Hewell (HMP)')
          expect($('[data-test="visit-2-date"]').text()).toBe('Monday 1 June 2026')
          expect($('[data-test="visit-2-time"]').text()).toBe('2pm to 3:30pm')
          expect($('[data-test="visit-2-prisoner-name"]').text()).toBe('Bob Jones')
          expect($('[data-test="visit-2-prison-number"]').text()).toBe('B1234CD')
          expect($('[data-test="visit-2-reference"]').text()).toBe('bc-de-fg-hi')
          expect($('[data-test="visit-2-visit-type"]').text()).toBe('Closed')
          expect($('[data-test="visit-2-visitor-1"]').text()).toContain('Adult One')
          expect($('[data-test="visit-2-child-visitor-1"]').text()).toContain('Child One')
          expect($('[data-test="visit-2-child-visitor-1"]').text()).toContain('Date of birth 1/1/2020 (6 years old)')
          expect($('[data-test="visit-2-child-visitor-2"]').text()).toContain('Child Two')
          expect($('[data-test="visit-2-child-visitor-2"]').text()).toContain('Date of birth 1/2/2026 (3 months old)')
          expect($('[data-test="visit-2-child-visitor-3"]').text()).toContain('Child Three')
          expect($('[data-test="visit-2-child-visitor-3"]').text()).toContain('Date of birth 1/4/2026 (1 month old)')
          expect($('[data-test="visit-2-pass-created-date"]').text()).toBe('Wednesday 20 May 2026 at 11:00am')

          expect($('[data-test="no-visit-passes"]').length).toBe(0)

          expect(visitService.getVisitPasses).toHaveBeenCalledWith({ date, prisonId: 'HEI', username: 'user1' })
          expect(auditService.printedVisitPasses).toHaveBeenCalledWith({
            date,
            prisonId: 'HEI',
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should show message and no print button if no passes to print', () => {
      visitService.getVisitPasses.mockResolvedValue([])

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').eq(0).text().trim()).toBe('Print visit passes')
          expect($('[data-test="print-all"]').length).toBe(0)
          expect($('[data-test="no-visit-passes"]').length).toBe(1)

          expect(visitService.getVisitPasses).toHaveBeenCalledWith({ date, prisonId: 'HEI', username: 'user1' })
          expect(auditService.printedVisitPasses).toHaveBeenCalledWith({
            date,
            prisonId: 'HEI',
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should redirect back to the visits by date page if trying to print passes in the past', () => {
      return request(app)
        .get('/visit-passes?date=2025-05-19') // yesterday
        .expect(302)
        .expect('location', '/visits')
        .expect(() => {
          expect(visitService.getVisitPasses).not.toHaveBeenCalled()
          expect(auditService.printedVisitPasses).not.toHaveBeenCalled()
        })
    })

    it('should redirect back to visits by date page if API returns a 400 Bad Request', () => {
      visitService.getVisitPasses.mockRejectedValue(new BadRequest())

      return request(app)
        .get(url)
        .expect(302)
        .expect('location', '/visits')
        .expect(() => {
          expect(visitService.getVisitPasses).toHaveBeenCalled()
          expect(auditService.printedVisitPasses).not.toHaveBeenCalled()
        })
    })

    it('should handle other API errors with default error handler', () => {
      visitService.getVisitPasses.mockRejectedValue(new InternalServerError())

      return request(app)
        .get(url)
        .expect(500)
        .expect(() => {
          expect(visitService.getVisitPasses).toHaveBeenCalled()
          expect(auditService.printedVisitPasses).not.toHaveBeenCalled()
        })
    })
  })
})

describe('Print visit pass by visit reference', () => {
  const visitPass = TestData.visitPassDto()
  const { reference } = visitPass
  const url = `/visit/${reference}/visit-pass?from=visit`

  describe(`GET ${url}`, () => {
    it('should return a 404 if the feature is not enabled', () => {
      setFeature('printVisitPasses', false)
      app = appWithAllRoutes({ services: { auditService, visitService } })
      return request(app).get(url).expect(404)
    })

    it('should render visit passes page for given visit reference and selected establishment', () => {
      visitService.getVisitPass.mockResolvedValue(visitPass)

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Print visit pass -/)
          expect($('.govuk-back-link').attr('href')).toBe(`/visit/${reference}`)
          expect($('h1').eq(0).text().trim()).toBe('Print visit pass')
          expect($('[data-test="print-all"]').length).toBe(1)

          expect($('.visit-pass').length).toBe(1)

          expect($('[data-test="visit-1-prison-name"]').text()).toBe('Hewell (HMP)')
          expect($('[data-test="visit-1-date"]').text()).toBe('Monday 1 June 2026')
          expect($('[data-test="visit-1-time"]').text()).toBe('10am to 11am')
          expect($('[data-test="visit-1-prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="visit-1-prison-number"]').text()).toBe('A1234BC')
          expect($('[data-test="visit-1-reference"]').text()).toBe('ab-cd-ef-gh')
          expect($('[data-test="visit-1-visit-type"]').text()).toBe('Open')
          expect($('[data-test="visit-1-visitor-1"]').text()).toContain('Jeanette Smith')
          expect($('[data-test="visit-1-visitor-1"]').text()).toContain(
            '23B, Premises, 123 The Street, Coventry, C1 2AB',
          )
          expect($('[data-test="visit-1-pass-created-date"]').text()).toBe('Wednesday 20 May 2026 at 11:00am')

          expect($('[data-test="no-visit-passes"]').length).toBe(0)

          expect(visitService.getVisitPass).toHaveBeenCalledWith({ prisonId: 'HEI', reference, username: 'user1' })
          expect(auditService.printedVisitPass).toHaveBeenCalledWith({
            visitReference: reference,
            prisonerId: visitPass.prisonerId,
            prisonId: 'HEI',
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should redirect back to visit booking details page if visit date is in the past', () => {
      visitService.getVisitPass.mockResolvedValue({ ...visitPass, visitDate: '2025-05-19' })

      return request(app)
        .get(url)
        .expect(302)
        .expect('location', `/visit/${reference}`)
        .expect(res => {
          expect(visitService.getVisitPass).toHaveBeenCalledWith({ prisonId: 'HEI', reference, username: 'user1' })
          expect(auditService.printedVisitPass).not.toHaveBeenCalled()
        })
    })

    it('should redirect back to visit booking details page if API returns a 400 Bad Request', () => {
      visitService.getVisitPass.mockRejectedValue(new BadRequest())

      return request(app)
        .get(url)
        .expect(302)
        .expect('location', `/visit/${reference}`)
        .expect(() => {
          expect(visitService.getVisitPass).toHaveBeenCalled()
          expect(auditService.printedVisitPass).not.toHaveBeenCalled()
        })
    })

    it('should handle other API errors with default error handler', () => {
      visitService.getVisitPass.mockRejectedValue(new InternalServerError())

      return request(app)
        .get(url)
        .expect(500)
        .expect(() => {
          expect(visitService.getVisitPass).toHaveBeenCalled()
          expect(auditService.printedVisitPass).not.toHaveBeenCalled()
        })
    })
  })
})
