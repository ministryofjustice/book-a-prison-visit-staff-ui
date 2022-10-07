import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../../utils/nunjucksSetup'
import { VisitSlotList } from '../../../@types/bapv'

const template = fs.readFileSync('server/views/pages/bookAVisit/dateAndTime.njk')

describe('Views - Date and time of visit', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
    viewContext = {}
  })

  it('should display message, back to start button and no accordion when no visit slots', () => {
    viewContext = {}
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('main p').text()).toContain('There are no available slots for the selected time and day.')
    expect($('.govuk-accordion').length).toBe(0)
    expect($('[data-test="submit"]').length).toBe(0)
    expect($('[data-test="back-to-start"]').length).toBe(1)
  })

  it('should display date and time picker for two months with morning and afternoon slots', () => {
    viewContext = {
      accordionId: 'thisAccordion',
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
                  startTimestamp: '2022-02-14T10:00:00',
                  endTimestamp: '2022-02-14T11:00:00',
                  availableTables: 15,
                  capacity: 30,
                  visitRoomName: 'room name',
                  visitRestriction: 'OPEN',
                },
                {
                  id: '2',
                  startTimestamp: '2022-02-14T11:59:00',
                  endTimestamp: '2022-02-14T12:59:00',
                  availableTables: 1,
                  capacity: 30,
                  visitRoomName: 'room name',
                  visitRestriction: 'OPEN',
                },
              ],
              afternoon: [
                {
                  id: '3',
                  startTimestamp: '2022-02-14T12:00:00',
                  endTimestamp: '2022-02-14T13:05:00',
                  availableTables: 5,
                  capacity: 30,
                  visitRoomName: 'room name',
                  // representing a pre-existing visit that is BOOKED
                  sessionConflicts: ['DOUBLE_BOOKED'],
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
                  startTimestamp: '2022-02-15T16:00:00',
                  endTimestamp: '2022-02-15T17:00:00',
                  availableTables: 12,
                  capacity: 30,
                  visitRoomName: 'room name',
                  // representing the RESERVED visit being handled in this session
                  sessionConflicts: ['DOUBLE_BOOKED'],
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
                  startTimestamp: '2022-03-01T09:30:00',
                  endTimestamp: '2022-03-01T10:30:00',
                  availableTables: 0, // fully booked
                  capacity: 30,
                  visitRoomName: 'room name',
                  visitRestriction: 'OPEN',
                },
                {
                  id: '6',
                  startTimestamp: '2022-03-01T10:30:00',
                  endTimestamp: '2022-03-01T11:30:00',
                  availableTables: -2, // overbooked
                  capacity: 1,
                  visitRoomName: 'room name',
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

    expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
    expect($('[data-test="visit-restriction"]').text()).toBe('Open')
    expect($('[data-test="closed-visit-reason"]').length).toBe(0)

    expect($('[data-test="month"]').eq(0).text()).toBe('February 2022')
    expect($('#slots-month-February2022-thisAccordion-heading-1').text().trim()).toBe('Monday 14 February')
    expect($('#slots-month-February2022-thisAccordion-content-1 h3').eq(0).text()).toBe('Morning')
    expect($('label[for="1"]').text()).toContain('10am to 11am')
    expect($('label[for="1"]').text()).toContain('15 tables available')
    expect($('label[for="2"]').text()).toContain('11:59am to 12:59pm')
    expect($('label[for="2"]').text()).toContain('1 table available')
    expect($('label[for="3"]').text()).toContain('12pm to 1:05pm')
    expect($('label[for="3"]').text()).toContain('Prisoner has a visit')
    expect($('#3').attr('disabled')).toBe('disabled')
    expect($('#slots-month-February2022-thisAccordion-content-1 .bapv-afternoon-slots > h3').text()).toBe('Afternoon')
    expect($('#slots-month-February2022-thisAccordion-heading-2').text().trim()).toBe('Tuesday 15 February')
    expect($('#4').prop('checked')).toBe(true)
    expect($('.govuk-accordion__section--expanded').length).toBe(1)
    expect($('.govuk-accordion__section--expanded #4').length).toBe(1)

    expect($('[data-test="month"]').eq(1).text()).toBe('March 2022')
    expect($('#slots-month-March2022-thisAccordion-heading-1').text().trim()).toBe('Tuesday 1 March')
    expect($('#slots-month-March2022-thisAccordion-content-1 .bapv-morning-slots > h3').text()).toBe('Morning')
    expect($('#slots-month-March2022-thisAccordion-content-1 .bapv-afternoon-slots > h3').eq(1).length).toBe(0) // no afternoon slots
    expect($('label[for="5"]').text()).toContain('9:30am to 10:30am')
    expect($('label[for="5"]').text()).toContain('Fully booked (30 of 30 tables booked)')
    // correctly display overbooking
    expect($('label[for="6"]').text()).toContain('10:30am to 11:30am')
    expect($('label[for="6"]').text()).toContain('Fully booked (3 of 1 table booked)')

    expect($('[data-test="submit"]').text().trim()).toBe('Continue')
  })

  it('should display information banner for closed visit due to visitor restriction, and not the restriction change message', () => {
    viewContext = {
      prisonerName: 'John Smith',
      visitRestriction: 'CLOSED',
      closedVisitReason: 'visitor',
      slotsList: {},
      slotsPresent: false,
    }
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
    expect($('[data-test="visit-restriction"]').text()).toBe('Closed')
    expect($('[data-test="closed-visit-reason"]').text()).toContain(
      'Closed visit as a visitor has a closed visit restriction',
    )
    expect($('[data-test="restriction-change-reason"]').length).toBe(0)
  })

  it('should display closed restriction reason only, not the restriction change message', () => {
    viewContext = {
      prisonerName: 'John Smith',
      visitRestriction: 'CLOSED',
      closedVisitReason: 'visitor',
      restrictionChangeMessage:
        'This is now a closed visit due to a visitor restriction. The visit time can stay the same.',
      slotsList: {},
      slotsPresent: false,
    }
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
    expect($('[data-test="visit-restriction"]').text()).toBe('Closed')
    expect($('[data-test="closed-visit-reason"]').length).toBe(0)
    expect($('[data-test="restriction-change-reason"]').text()).toContain(
      'This is now a closed visit due to a visitor restriction. The visit time can stay the same.',
    )
  })
})
