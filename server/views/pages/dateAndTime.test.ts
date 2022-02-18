import fs from 'fs'
import cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../utils/nunjucksSetup'

const template = fs.readFileSync('server/views/pages/dateAndTime.njk')

describe('Views - Date and time of visit', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
    viewContext = {}
  })

  it('should display message and no accordion when no visit slots', () => {
    viewContext = {}
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('main p').text()).toContain('There are no visit time slots for the next 28 days.')
    expect($('.govuk-accordion').length).toBe(0)
  })

  it('should display date and time picker for two months with morning and afternoon slots', () => {
    viewContext = {
      offenderNo: 'A1234BC',
      prisonerName: 'John Smith',
      slotsList: {
        'February 2022': [
          {
            date: 'Monday 14 February',
            slots: {
              morning: [
                {
                  id: '1',
                  startTimestamp: '2022-02-14T10:00:00',
                  endTimestamp: '2022-02-14T11:00:00',
                  availableTables: 15,
                },
                {
                  id: '2',
                  startTimestamp: '2022-02-14T11:59:00',
                  endTimestamp: '2022-02-14T12:59:00',
                  availableTables: 1,
                },
              ],
              afternoon: [
                {
                  id: '3',
                  startTimestamp: '2022-02-14T12:00:00',
                  endTimestamp: '2022-02-14T13:05:00',
                  availableTables: 5,
                },
              ],
            },
          },
          {
            date: 'Tuesday 15 February',
            slots: {
              morning: [],
              afternoon: [
                {
                  id: '4',
                  startTimestamp: '2022-02-15T16:00:00',
                  endTimestamp: '2022-02-15T17:00:00',
                  availableTables: 12,
                },
              ],
            },
          },
        ],
        'March 2022': [
          {
            date: 'Tuesday 1 March',
            slots: {
              morning: [
                {
                  id: '5',
                  startTimestamp: '2022-03-01T09:30:00',
                  endTimestamp: '2022-03-01T10:30:00',
                  availableTables: 0,
                },
              ],
              afternoon: [],
            },
          },
        ],
      },
      timeOfDay: '',
      dayOfTheWeek: '',
    }
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-test="prisoner-name"]').text()).toContain('John Smith')

    expect($('[data-test="month"]').eq(0).text()).toBe('February 2022')
    expect($('#slots-month-February2022-heading-1').text().trim()).toBe('Monday 14 February')
    expect($('#slots-month-February2022-content-1 h3').eq(0).text()).toBe('Morning')
    expect($('label[for="1"]').text()).toContain('10am to 11am')
    expect($('label[for="1"]').text()).toContain('15 tables available')
    expect($('label[for="2"]').text()).toContain('11:59am to 12:59pm')
    expect($('label[for="2"]').text()).toContain('1 table available')
    expect($('#slots-month-February2022-content-1 h3').eq(1).text()).toBe('Afternoon')
    expect($('[data-test="month"]').eq(1).text()).toBe('March 2022')
  })
})
