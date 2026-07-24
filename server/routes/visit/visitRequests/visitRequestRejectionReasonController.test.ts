import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../../testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /visit/:reference/request/reject/reason', () => {
  it('should render the rejection reason page with all reasons listed', () => {
    return request(app)
      .get('/visit/ab-cd-ef-gh/request/reject/reason')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Rejection reason (optional)')
        expect($('input[name="rejectionReason"]').length).toBe(2)
        expect($('label[for="rejectionReason"]').text().trim()).toBe('The prisoner has used up their entitlement')
        expect($('label[for="rejectionReason-2"]').text().trim()).toBe('A restriction or an alert prevents this visit')
        expect($('[data-test="submit"]').text().trim()).toBe('Confirm rejection')
      })
  })

  it('should set the form action and back link with no nav state when no query params given', () => {
    return request(app)
      .get('/visit/ab-cd-ef-gh/request/reject/reason')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('form').attr('action')).toBe('/visit/ab-cd-ef-gh/request/reject')
        expect($('.govuk-back-link').attr('href')).toBe('/visit/ab-cd-ef-gh')
      })
  })

  it('should preserve nav state in form action and back link', () => {
    return request(app)
      .get('/visit/ab-cd-ef-gh/request/reject/reason?from=visits&query=type%3DOPEN%26selectedDate%3D2024-02-01')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('form').attr('action')).toBe(
          '/visit/ab-cd-ef-gh/request/reject?from=visits&query=type%3DOPEN%26selectedDate%3D2024-02-01',
        )
        expect($('.govuk-back-link').attr('href')).toBe(
          '/visit/ab-cd-ef-gh?from=visits&query=type%3DOPEN%26selectedDate%3D2024-02-01',
        )
      })
  })
})
