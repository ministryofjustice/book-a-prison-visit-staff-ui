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
                  startTime: '10am',
                  endTime: '11am',
                  availableTables: 15,
                },
                {
                  id: '2',
                  startTime: '11:59am',
                  endTime: '12:59pm',
                  availableTables: 1,
                },
              ],
              afternoon: [
                {
                  id: '3',
                  startTime: '12pm',
                  endTime: '1:05pm',
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
                  startTime: '4pm',
                  endTime: '5pm',
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
                  startTime: '9:30am',
                  endTime: '10:30am',
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
    expect($('#slots-month-February2022-heading-2').text().trim()).toBe('Tuesday 15 February')

    expect($('[data-test="month"]').eq(1).text()).toBe('March 2022')
    expect($('#slots-month-March2022-heading-1').text().trim()).toBe('Tuesday 1 March')
    expect($('#slots-month-March2022-content-1 h3').eq(0).text()).toBe('Morning')
    expect($('#slots-month-March2022-content-1 h3').eq(1).length).toBe(0) // no afternoon slots
    expect($('label[for="5"]').text()).toContain('9:30am to 10:30am')
    expect($('label[for="5"]').text()).toContain('Fully booked')
  })
})
