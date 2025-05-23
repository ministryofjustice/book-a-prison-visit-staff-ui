import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../../utils/nunjucksSetup'
import { VisitSlot, VisitSlotList } from '../../../@types/bapv'
import TestData from '../../../routes/testutils/testData'

const template = fs.readFileSync('server/views/pages/bookAVisit/dateAndTime.njk')

describe('Views - Date and time of visit', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const prisonId = 'HEI'

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
    viewContext = {}
  })

  it('should display message, back to start button and no accordion when no visit slots', () => {
    viewContext = {}
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('main p').text()).toContain('There are no available time slots for this prisoner.')
    expect($('.govuk-accordion').length).toBe(0)
    expect($('[data-test="submit"]').length).toBe(0)
    expect($('[data-test="back-to-start"]').length).toBe(1)
  })

  it('should display date and time picker for two months with morning and afternoon slots', () => {
    viewContext = {
      prisonerName: 'John Smith',
      visitRestriction: 'OPEN',
      slotsList: <VisitSlotList>{
        'February 2022': [
          {
            date: 'Monday 14 February',
            prisonerEvents: {
              morning: [],
              afternoon: [],
            },
            slots: {
              morning: [
                {
                  id: '1',
                  sessionTemplateReference: 'v9d.7ed.7u1',
                  prisonId,
                  startTimestamp: '2022-02-14T10:00:00',
                  endTimestamp: '2022-02-14T11:00:00',
                  availableTables: 15,
                  capacity: 30,
                  visitRoom: 'Main visit hall',
                  visitRestriction: 'OPEN',
                },
                {
                  id: '2',
                  sessionTemplateReference: 'v9d.7ed.7u2',
                  prisonId,
                  startTimestamp: '2022-02-14T11:59:00',
                  endTimestamp: '2022-02-14T12:59:00',
                  availableTables: 1,
                  capacity: 30,
                  visitRoom: 'Main visit hall',
                  visitRestriction: 'OPEN',
                },
              ],
              afternoon: [
                {
                  id: '3',
                  sessionTemplateReference: 'v9d.7ed.7u3',
                  prisonId,
                  startTimestamp: '2022-02-14T12:00:00',
                  endTimestamp: '2022-02-14T13:05:00',
                  availableTables: 5,
                  capacity: 30,
                  visitRoom: 'Main visit hall',
                  // representing a pre-existing visit that is BOOKED
                  sessionConflicts: ['DOUBLE_BOOKING_OR_RESERVATION'],
                  visitRestriction: 'OPEN',
                },
              ],
            },
          },
          {
            date: 'Tuesday 15 February',
            prisonerEvents: {
              morning: [],
              afternoon: [],
            },
            slots: {
              morning: [],
              afternoon: [
                {
                  id: '4',
                  sessionTemplateReference: 'v9d.7ed.7u4',
                  prisonId,
                  startTimestamp: '2022-02-15T16:00:00',
                  endTimestamp: '2022-02-15T17:00:00',
                  availableTables: 12,
                  capacity: 30,
                  visitRoom: 'Main visit hall',
                  // representing the RESERVED visit being handled in this session
                  sessionConflicts: ['DOUBLE_BOOKING_OR_RESERVATION'],
                  visitRestriction: 'OPEN',
                },
              ],
            },
          },
        ],
        'March 2022': [
          {
            date: 'Tuesday 1 March',
            prisonerEvents: {
              morning: [],
              afternoon: [],
            },
            slots: {
              morning: [
                {
                  id: '5',
                  sessionTemplateReference: 'v9d.7ed.7u5',
                  prisonId,
                  startTimestamp: '2022-03-01T09:30:00',
                  endTimestamp: '2022-03-01T10:30:00',
                  availableTables: 0, // fully booked
                  capacity: 30,
                  visitRoom: 'Other visit hall',
                  visitRestriction: 'OPEN',
                },
                {
                  id: '6',
                  prisonId,
                  startTimestamp: '2022-03-01T10:30:00',
                  endTimestamp: '2022-03-01T11:30:00',
                  availableTables: -2, // overbooked
                  capacity: 1,
                  visitRoom: 'Other visit hall',
                  visitRestriction: 'OPEN',
                },
              ],
              afternoon: [],
            },
          },
        ],
      },
      formValues: { 'visit-date-and-time': '4' },
      slotsPresent: true,
    }
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('.govuk-details__text').text()).toContain('Showing time slots:')
    expect($('.govuk-details__text').text()).toContain(
      'suitable for the prisoner’s location, category and incentive level',
    )
    expect($('.govuk-details__text').text()).toContain('that do not have non-associations for the prisoner')
    expect($('.govuk-details__text').text()).toContain('over the next 28 days')
    expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
    expect($('[data-test="visit-restriction"]').text()).toBe('Open')
    expect($('[data-test="closed-visit-reason"]').length).toBe(0)

    expect($('[data-test="month"]').eq(0).text()).toBe('February 2022')
    expect($('#slots-month-February2022-heading-1').text().trim()).toBe('Monday 14 February')
    expect($('#slots-month-February2022-content-1 h3').eq(0).text()).toBe('Morning')
    expect($('label[for="1"]').text()).toContain('10am to 11am')
    expect($('label[for="1"]').text()).toContain('Main visit hall')
    expect($('label[for="1"]').text()).toContain('15 tables available')
    expect($('label[for="2"]').text()).toContain('11:59am to 12:59pm')
    expect($('label[for="2"]').text()).toContain('Main visit hall')
    expect($('label[for="2"]').text()).toContain('1 table available')
    expect($('label[for="3"]').text()).toContain('12pm to 1:05pm')
    expect($('label[for="3"]').text()).toContain('Main visit hall')
    expect($('label[for="3"]').text()).toContain('Prisoner has a visit')
    expect($('#3').attr('disabled')).toBe('disabled')
    expect($('#slots-month-February2022-content-1 .bapv-afternoon-slots > h3').text()).toBe('Afternoon')
    expect($('#slots-month-February2022-heading-2').text().trim()).toBe('Tuesday 15 February')
    expect($('#4').prop('checked')).toBe(true)
    expect($('.govuk-accordion__section--expanded').length).toBe(1)
    expect($('.govuk-accordion__section--expanded #4').length).toBe(1)

    expect($('[data-test="month"]').eq(1).text()).toBe('March 2022')
    expect($('#slots-month-March2022-heading-1').text().trim()).toBe('Tuesday 1 March')
    expect($('#slots-month-March2022-content-1 .bapv-morning-slots > h3').text()).toBe('Morning')
    expect($('#slots-month-March2022-content-1 .bapv-afternoon-slots > h3').eq(1).length).toBe(0) // no afternoon slots
    expect($('label[for="5"]').text()).toContain('9:30am to 10:30am')
    expect($('label[for="5"]').text()).toContain('Other visit hall')
    expect($('label[for="5"] .govuk-tag--red').text()).toContain('Fully booked')
    // correctly display overbooking
    expect($('label[for="6"]').text()).toContain('10:30am to 11:30am')
    expect($('label[for="6"]').text()).toContain('Other visit hall')
    expect($('label[for="6"] .govuk-tag--red').text()).toContain('Fully booked')

    expect($('[data-test="submit"]').text().trim()).toBe('Continue')
  })

  it('should display 422 validation error - MojAlert', () => {
    viewContext = {
      messages: [TestData.mojAlert()],
    }
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.moj-alert__content h2').text()).toContain('Another person has booked the last table.')
    expect($('.moj-alert').text()).toContain('Select whether to book for this time or choose a new visit time.')
  })

  describe('slot labelling', () => {
    beforeEach(() => {
      viewContext = {
        prisonerName: 'John Smith',
        visitRestriction: 'OPEN',
        slotsList: <VisitSlotList>{
          'February 2022': [
            {
              date: 'Monday 14 February',
              prisonerEvents: {
                morning: [],
                afternoon: [],
              },
              slots: {
                morning: [
                  {
                    id: '1',
                    sessionTemplateReference: 'v9d.7ed.7u1',
                    prisonId,
                    startTimestamp: '2022-02-14T10:00:00',
                    endTimestamp: '2022-02-14T11:00:00',
                    availableTables: 15,
                    capacity: 30,
                    visitRoom: 'room name',
                    visitRestriction: 'OPEN',
                  },
                ],
                afternoon: [],
              },
            },
          ],
        },
        timeOfDay: '',
        dayOfTheWeek: '',
        slotsPresent: true,
      }
    })

    it('should correctly label slot that is NOT checked when booking a visit', () => {
      viewContext.originalVisitSlot = undefined // booking journey; so no originally selected slot

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('#1').prop('checked')).toBe(false)
      expect($('label[for="1"]').text()).toContain('10am to 11am')
      expect($('label[for="1"]').text()).toContain('15 tables available')
    })

    it('should correctly label currently reserved slot when booking a visit', () => {
      viewContext.formValues = { 'visit-date-and-time': '1' }
      viewContext.originalVisitSlot = undefined // booking journey; so no originally selected slot

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('#1').prop('checked')).toBe(true)
      expect($('label[for="1"]').text()).toContain('10am to 11am')
      expect($('label[for="1"]').text()).toContain('Time slot reserved for this booking')
    })

    it('should correctly label the originally selected slot (when NOT checked) when updating a visit', () => {
      viewContext.originalVisitSlot = { id: '1' } as VisitSlot // update journey, so originally selected slot known

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('#1').prop('checked')).toBe(false)
      expect($('label[for="1"]').text()).toContain('10am to 11am')
      expect($('label[for="1"]').text()).toContain('Time slot reserved by the original booking')
    })

    it('should correctly label the originally selected slot (when checked) when updating a visit', () => {
      viewContext.formValues = { 'visit-date-and-time': '1' }
      viewContext.originalVisitSlot = { id: '1' } as VisitSlot // update journey, so originally selected slot known

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('#1').prop('checked')).toBe(true)
      expect($('label[for="1"]').text()).toContain('10am to 11am')
      expect($('label[for="1"]').text()).toContain('Time slot reserved by the original booking')
    })
  })
})
