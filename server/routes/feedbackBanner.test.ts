import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import { setFeature } from '../data/testutils/mockFeature'

describe('Feedback banner', () => {
  let app: Express

  it('should render feedback banner when feature is enabled', () => {
    setFeature('feedbackBanner', { enabled: true, url: 'feedback-url' })

    app = appWithAllRoutes({})

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('[data-test=feedback-banner]').length).toBe(1)
        expect($('.feedback-content a').attr('href')).toBe('feedback-url')
      })
  })

  it('should not render feedback banner when feature is disabled', () => {
    setFeature('feedbackBanner', { enabled: false, url: 'feedback-url' })

    app = appWithAllRoutes({})

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('[data-test=feedback-banner]').length).toBe(0)
      })
  })
})
