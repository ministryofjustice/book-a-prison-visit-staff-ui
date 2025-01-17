import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../../utils/nunjucksSetup'
import TestData from '../../../routes/testutils/testData'
import { VisitsPageSideNav } from '../../../@types/bapv'
import { VisitPreview, VisitRestriction } from '../../../data/orchestrationApiTypes'

const template = fs.readFileSync('server/views/pages/visitsByDate/visitsByDate.njk')

describe('Views - Visits by date', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
    viewContext = {}
  })

  it('should display three date tabs with one tab selected', () => {
    const dateTabs = [
      {
        text: 'Friday 2 February 2024',
        href: '/visits?selectedDate=2024-02-02&firstTabDate=2024-02-02',
        active: true,
      },
      {
        text: 'Saturday 3 February 2024',
        href: '/visits?selectedDate=2024-02-03&firstTabDate=2024-02-02',
        active: false,
      },
      {
        text: 'Sunday 4 February 2024',
        href: '/visits?selectedDate=2024-02-04&firstTabDate=2024-02-02',
        active: false,
      },
    ]

    viewContext = { dateTabs }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.moj-sub-navigation__link').length).toBe(3)
    expect($('.moj-sub-navigation__link').eq(0).text()).toBe(dateTabs[0].text)
    expect($('.moj-sub-navigation__link').eq(0).attr('href')).toBe(dateTabs[0].href)
    expect($('.moj-sub-navigation__link').eq(0).attr('aria-current')).toBe('page')

    expect($('.moj-sub-navigation__link').eq(1).text()).toBe(dateTabs[1].text)
    expect($('.moj-sub-navigation__link').eq(1).attr('href')).toBe(dateTabs[1].href)
    expect($('.moj-sub-navigation__link').eq(1).attr('aria-current')).toBe(undefined)

    expect($('.moj-sub-navigation__link').eq(2).text()).toBe(dateTabs[2].text)
    expect($('.moj-sub-navigation__link').eq(2).attr('href')).toBe(dateTabs[2].href)
    expect($('.moj-sub-navigation__link').eq(2).attr('aria-current')).toBe(undefined)
  })

  it('should display message and no side-nav or table when no visits and no session schedule', () => {
    viewContext = {}

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.moj-side-navigation').length).toBe(0)
    expect($('[data-test="no-visits-message"]').text()).toContain('No visit sessions on this day.')
    expect($('.bapv-table').length).toBe(0)
  })

  it('should display side-nav and session headings when session schedule set but no visits', () => {
    const sessionsSideNav: VisitsPageSideNav = new Map([
      [
        'Visits hall',
        [
          {
            reference: 'ref-1',
            times: '10am to 11am',
            queryParams: 'query-1',
            active: true,
          },
        ],
      ],
      [
        'Visits hall 2',
        [
          {
            reference: 'ref-2',
            times: '2pm to 3pm',
            queryParams: 'query-2',
            active: false,
          },
        ],
      ],
    ])

    const sessionSchedule = TestData.sessionSchedule({
      sessionTemplateReference: 'ref-1',
      sessionTimeSlot: { startTime: '10:00', endTime: '11:00' },
      capacity: { open: 20, closed: 5 },
    })
    const queryParamsForBackLink = 'back-link-query'
    const visits: Record<VisitRestriction, { numVisitors: number; visits: VisitPreview[] }> = {
      CLOSED: { numVisitors: 0, visits: [] },
      OPEN: { numVisitors: 0, visits: [] },
      UNKNOWN: { numVisitors: 0, visits: [] },
    }

    viewContext = {
      sessionSchedule,
      sessionsSideNav,
      queryParamsForBackLink,
      visits,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.moj-side-navigation h4').eq(0).text()).toBe('Visits hall')
    expect($('.moj-side-navigation ul').eq(0).find('a').text()).toBe('10am to 11am - Visits hall')
    expect($('.moj-side-navigation ul').eq(0).find('a').first().attr('href')).toBe('/visits?query-1')
    expect($('.moj-side-navigation__item--active a').attr('href')).toBe('/visits?query-1')

    expect($('.moj-side-navigation h4').eq(1).text()).toBe('Visits hall 2')
    expect($('.moj-side-navigation ul').eq(1).find('a').first().text()).toBe('2pm to 3pm - Visits hall 2')
    expect($('.moj-side-navigation ul').eq(1).find('a').first().attr('href')).toBe('/visits?query-2')

    expect($('[data-test=visit-room-caption]').text()).toBe('Visits hall')
    expect($('h2').text()).toBe('Visits from 10am to 11am')
    expect($('[data-test=visit-section-heading-closed]').text().trim()).toBe('Closed visits')
    expect($('[data-test=visit-tables-booked-closed]').text().trim()).toBe('0 of 5 tables booked')
    expect($('[data-test=visit-visitors-total-closed]').length).toBe(0)
    expect($('[data-test=visit-section-heading-open]').text().trim()).toBe('Open visits')
    expect($('[data-test=visit-tables-booked-open]').text().trim()).toBe('0 of 20 tables booked')
    expect($('[data-test=visit-visitors-total-open]').length).toBe(0)

    expect($('[data-test="no-visits-message"]').length).toBe(0)
  })

  it('should display appropriate message for an exclude date with no visits', () => {
    viewContext = { visits: {}, isAnExcludeDate: true, isAnExcludeDateWithVisitNotifications: false }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.moj-side-navigation').length).toBe(0)
    expect($('[data-test="no-visits-message"]').text()).toContain(
      'This date has been blocked for social visits. There are no existing bookings to cancel.',
    )
    expect($('.bapv-table').length).toBe(0)
  })

  it('should display appropriate message for an exclude date with visits that need review', () => {
    viewContext = {
      queryParamsForBackLink: 'back-link-params',
      visits: {},
      isAnExcludeDate: true,
      isAnExcludeDateWithVisitNotifications: true,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.moj-side-navigation').length).toBe(0)
    expect($('[data-test="no-visits-message"]').text()).toContain(
      'This date has been blocked for social visits. There are existing bookings that need review.',
    )
    expect($('[data-test="no-visits-message"] a').prop('href')).toBe('/review')
    expect($('.bapv-table').length).toBe(0)
  })

  it('should display visits table', () => {
    const sessionsSideNav: VisitsPageSideNav = new Map([
      [
        'Visits hall',
        [
          {
            reference: 'ref-1',
            times: '10am to 11am',
            queryParams: 'query-1',
            active: true,
          },
        ],
      ],
    ])

    const sessionSchedule = TestData.sessionSchedule({
      sessionTemplateReference: 'ref-1',
      sessionTimeSlot: { startTime: '10:00', endTime: '11:00' },
    })
    const queryParamsForBackLink = 'back-link-query'
    const visits: Record<VisitRestriction, { numVisitors: number; visits: VisitPreview[] }> = {
      CLOSED: { numVisitors: 0, visits: [] },
      OPEN: { numVisitors: 2, visits: [TestData.visitPreview()] },
      UNKNOWN: { numVisitors: 0, visits: [] },
    }

    viewContext = { sessionSchedule, sessionsSideNav, queryParamsForBackLink, visits }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-test=visit-section-heading-open]').text().trim()).toBe('Open visits')
    expect($('[data-test=visit-tables-booked-open]').text().trim()).toBe('1 of 40 tables booked')
    expect($('[data-test=visit-visitors-total-open]').text()).toBe('2 visitors')

    expect($('[data-test=visits-open] [data-test="prisoner-name"]').eq(0).text()).toBe('Smith, John')
    expect($('[data-test=visits-open] [data-test="prisoner-number"]').eq(0).text()).toBe('A1234BC')
    expect($('[data-test=visits-open] [data-test="booked-on"]').eq(0).text()).toBe('1 January at 9am')
    expect($('[data-test=visits-open] [data-test="view-visit-link"]').eq(0).attr('href')).toBe(
      '/visit/ab-cd-ef-gh?back-link-query',
    )

    expect($('[data-test="no-visits-message"]').length).toBe(0)
  })
})
