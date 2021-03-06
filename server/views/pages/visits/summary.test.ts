import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../../utils/nunjucksSetup'

const template = fs.readFileSync('server/views/pages/visits/summary.njk')

describe('Views - Visits summary', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
    viewContext = {}
  })

  it('should display message and no table when no visits', () => {
    viewContext = {}
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('#search-results-none').text()).toContain('No visit sessions on this day.')
    expect($('.bapv-table').length).toBe(0)
  })

  it('should display side menu, visit room, time, visitor and table totals and list of prisoners in visit slot', () => {
    viewContext = {
      totals: {
        visitors: 11,
        adults: 4,
        children: 7,
      },
      slotsNav: [
        {
          heading: {
            text: 'Main visits room',
            classes: 'govuk-!-padding-top-0',
          },
          items: [
            {
              text: '10am to 11am',
              href: '/visits?selectedDate=2022-05-23&time=10am to 11am&type=OPEN',
              active: true,
            },
          ],
        },
      ],
      results: [
        [
          {
            text: 'Rocky, Asap',
            attributes: {
              'data-test': 'prisoner-name',
            },
          },
          {
            text: 'A8709DY',
            attributes: {
              'data-test': 'prisoner-number',
            },
          },
          {
            html: '<a href="" class="bapv-result-row">View</a>',
            classes: 'govuk-!-text-align-right',
          },
        ],
      ],
      visitType: 'OPEN',
      maxSlots: 5,
      slotTime: '9am to 10am',
      next: 1,
      previous: 1,
      numberOfResults: 2,
      pageSize: 10,
      from: 1,
      to: 10,
      pageLinks: '',
    }
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-test="visit-room"]').text()).toBe('Main')
    expect($('[data-test="visit-time"]').text()).toBe('9am to 10am')
    expect($('[data-test="visit-tables-booked"]').text()).toBe('2 of 5')
    expect($('[data-test="visit-visitors-total"]').text()).toBe('11')
    expect($('[data-test="visit-adults"]').text()).toBe('4')
    expect($('[data-test="visit-children"]').text()).toBe('7')
    expect($('[data-test="prisoner-number"]').text()).toBe('A8709DY')
    expect($('[data-test="prisoner-name"]').text()).toBe('Rocky, Asap')
    expect($('.moj-side-navigation__title').text()).toContain('Main visits room')
    expect($('.moj-side-navigation__item--active').text()).toContain('10am to 11am')
  })
})
