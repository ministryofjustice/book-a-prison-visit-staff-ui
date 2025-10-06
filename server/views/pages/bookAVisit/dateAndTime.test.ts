import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks from 'nunjucks'
import { registerNunjucks } from '../../../utils/nunjucksSetup'
import TestData from '../../../routes/testutils/testData'
import { DateAndTimeNoVisitSessionsPageData, DateAndTimePageData } from '../../../routes/visitJourney/dateAndTime'

describe('Select date and time page (calendar)', () => {
  const njkEnv = registerNunjucks()

  describe('No available visit sessions', () => {
    const template = fs.readFileSync('server/views/pages/bookAVisit/dateAndTimeNoVisitSessions.njk')
    const compiledTemplate = nunjucks.compile(template.toString(), njkEnv)

    const viewContext: DateAndTimeNoVisitSessionsPageData = {
      urlPrefix: 'url-prefix',
      messages: [TestData.mojAlert()],
      prisonerName: 'John Smith',
      prisonerLocation: '1-1-C-028',
      visitRestriction: 'OPEN',
    }

    it('should render visit cannot be booked page', () => {
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      // Page header
      expect($('title').text()).toMatch(/^A visit cannot be booked -/)
      expect($('.govuk-back-link').attr('href')).toBe('url-prefix/select-visitors')
      expect($('.moj-alert').length).toBe(1)
      expect($('.moj-alert').text()).toContain(TestData.mojAlert().title)
      expect($('h1').text()).toBe('A visit cannot be booked')

      // Prisoner info
      expect($('[data-test=prisoner-name]').text()).toBe('John Smith')
      expect($('[data-test=prisoner-location]').text()).toBe('1-1-C-028')
      expect($('[data-test=visit-restriction]').text()).toBe('Open')

      expect($('[data-test=booking-days-ahead]').length).toBe(0)

      expect($('main').text()).toContain('There are no available visit times')
      expect($('[data-test=back-to-start]').attr('href')).toBe('/back-to-start')
    })
  })

  describe('Available visit sessions', () => {
    const template = fs.readFileSync('server/views/pages/bookAVisit/dateAndTime.njk')
    const compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
    let viewContext: DateAndTimePageData

    beforeEach(() => {
      viewContext = {
        urlPrefix: 'url-prefix',
        errors: [],
        formValues: {},
        messages: [TestData.mojAlert()],
        prisonerName: 'John Smith',
        prisonerLocation: '1-1-C-028',
        visitRestriction: 'OPEN',
        policyNoticeDaysMax: 28,
        calendar: [],
        originalVisitSession: undefined,
        firstVisitSessionRadioInputId: '',
        scheduledEventsAvailable: true,
      }
    })

    it('should render key page elements', () => {
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      // Page header
      expect($('title').text()).toMatch(/^Select date and time of visit -/)
      expect($('.govuk-back-link').attr('href')).toBe('url-prefix/select-visitors')
      expect($('.moj-alert').length).toBe(1)
      expect($('.moj-alert').text()).toContain(TestData.mojAlert().title)
      expect($('h1').text()).toBe('Select date and time of visit')

      // Prisoner info
      expect($('[data-test=prisoner-name]').text()).toBe('John Smith')
      expect($('[data-test=prisoner-location]').text()).toBe('1-1-C-028')
      expect($('[data-test=visit-restriction]').text()).toBe('Open')

      // Calendar key
      expect($('[data-test=booking-days-ahead]').text()).toBe('28')

      // No events unavailable message
      expect($('[data-test=prisoner-schedule-unavailable]').length).toBe(0)

      // Form and button
      expect($('form').attr('action')).toBe('url-prefix/select-date-and-time')
      expect($('[data-test=submit]').text().trim()).toBe('Continue')
    })

    it('should render calendar grid days split into months', () => {
      // Two dates across two months
      viewContext.calendar = [
        {
          date: '2025-08-31',
          monthHeading: 'August',
          selected: false,
          outline: false,
          visitSessions: [
            {
              date: '2025-08-31',
              sessionTemplateReference: 'a',
              daySection: 'morning',
              startTime: '10:00',
              endTime: '11:00',
              visitRoom: 'Visit room',
              availableTables: 18,
              capacity: 20,
              sessionConflicts: [],
              disabled: false,
            },
          ],
          scheduledEvents: [],
        },
        {
          date: '2025-09-01',
          monthHeading: 'September',
          selected: false,
          outline: false,
          visitSessions: [],
          scheduledEvents: [],
        },
      ]
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('.bapv-calendar h2').length).toBe(2)
      expect($('.bapv-calendar__month').length).toBe(2)

      // First month (has day headings)
      expect($('.bapv-calendar').children('h2').eq(0).text()).toBe('August')
      expect($('.bapv-calendar').children('h2').eq(0).next('.bapv-calendar__day-headings').length).toBe(1)
      expect($('.bapv-calendar__month').eq(0).children('.bapv-calendar__day').length).toBe(1)
      expect(
        $('.bapv-calendar__month').eq(0).children('.bapv-calendar__day').eq(0).text().trim().replace(/\s+/g, ' '),
      ).toBe('31 August - Sunday - 1 visit time')
      expect(
        $('.bapv-calendar__month')
          .eq(0)
          .children('.bapv-calendar__day')
          .eq(0)
          .hasClass('bapv-calendar__day--start-col-7'),
      ).toBe(true) // grid column offset

      // Second month (no day headings)
      expect($('.bapv-calendar').children('h2').eq(1).text()).toBe('September')
      expect($('.bapv-calendar').children('h2').eq(1).next('.bapv-calendar__day-headings').length).toBe(0)
      expect($('.bapv-calendar__month').eq(1).children('.bapv-calendar__day').length).toBe(1)
      expect(
        $('.bapv-calendar__month').eq(1).children('.bapv-calendar__day').eq(0).text().trim().replace(/\s+/g, ' '),
      ).toBe('1 September - Monday - no visit times')
      expect(
        $('.bapv-calendar__month')
          .eq(1)
          .children('.bapv-calendar__day')
          .eq(0)
          .hasClass('bapv-calendar__day--start-col-1'),
      ).toBe(true) // grid column offset
    })

    it('should render day headings for all months if 3 or more months', () => {
      viewContext.calendar = [
        {
          date: '2025-08-31',
          monthHeading: 'August',
          selected: false,
          outline: false,
          visitSessions: [],
          scheduledEvents: [],
        },
        {
          date: '2025-09-01',
          monthHeading: 'September',
          selected: false,
          outline: false,
          visitSessions: [],
          scheduledEvents: [],
        },
        {
          date: '2025-10-01',
          monthHeading: 'October',
          selected: false,
          outline: false,
          visitSessions: [],
          scheduledEvents: [],
        },
      ]
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('.bapv-calendar h2').length).toBe(3)
      expect($('.bapv-calendar__month').length).toBe(3)

      expect($('.bapv-calendar').children('h2').eq(0).text()).toBe('August')
      expect($('.bapv-calendar').children('h2').eq(0).next('.bapv-calendar__day-headings').length).toBe(1)
      expect($('.bapv-calendar').children('h2').eq(1).text()).toBe('September')
      expect($('.bapv-calendar').children('h2').eq(1).next('.bapv-calendar__day-headings').length).toBe(1)
      expect($('.bapv-calendar').children('h2').eq(2).text()).toBe('October')
      expect($('.bapv-calendar').children('h2').eq(2).next('.bapv-calendar__day-headings').length).toBe(1)
    })

    it('should render calendar grid days with classes for colour, selected, outline', () => {
      viewContext.calendar = [
        {
          date: '2025-08-31',
          monthHeading: 'August',
          colour: 'orange',
          selected: true,
          outline: true,
          visitSessions: [
            {
              date: '2025-08-31',
              sessionTemplateReference: 'a',
              daySection: 'morning',
              startTime: '10:00',
              endTime: '11:00',
              visitRoom: 'Visit room',
              availableTables: 18,
              capacity: 20,
              sessionConflicts: [],
              disabled: false,
            },
          ],
          scheduledEvents: [],
        },
      ]
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('.bapv-calendar li[data-date=2025-08-31]').hasClass('bapv-calendar__day--selected')).toBe(true)
      expect($('.bapv-calendar li[data-date=2025-08-31]').hasClass('bapv-calendar__day--outline')).toBe(true)
      expect($('.bapv-calendar li[data-date=2025-08-31]').hasClass('bapv-calendar__day--orange')).toBe(true)
    })

    it('should render render visit sessions and events split into morning and afternoon', () => {
      viewContext.calendar = [
        // day with no visit sessions
        {
          date: '2025-08-30',
          monthHeading: 'August',
          selected: false,
          outline: false,
          visitSessions: [],
          scheduledEvents: [],
        },
        // day with both a morning and afternoon visit session and event
        {
          date: '2025-08-31',
          monthHeading: 'August',
          selected: false,
          outline: false,
          visitSessions: [
            {
              date: '2025-08-31',
              sessionTemplateReference: 'a',
              daySection: 'morning',
              startTime: '10:00',
              endTime: '11:00',
              visitRoom: 'Visit Room 1',
              availableTables: 18,
              capacity: 20,
              sessionConflicts: [],
              disabled: false,
            },
            {
              date: '2025-08-31',
              sessionTemplateReference: 'b',
              daySection: 'afternoon',
              startTime: '13:30',
              endTime: '15:00',
              visitRoom: 'Visit Room 2',
              availableTables: 1,
              capacity: 20,
              sessionConflicts: [],
              disabled: true,
            },
          ],
          scheduledEvents: [
            {
              daySection: 'morning',
              startTime: '09:00',
              endTime: '11:00',
              description: 'Activity - Education 1',
            },
            {
              daySection: 'afternoon',
              startTime: '14:30',
              endTime: '16:00',
              description: 'Activity - Education 2',
            },
          ],
        },
        // day with morning visit and afternoon events, so afternoon section should not render
        {
          date: '2025-09-01',
          monthHeading: 'September',
          selected: false,
          outline: false,
          visitSessions: [
            {
              date: '2025-09-01',
              sessionTemplateReference: 'c',
              daySection: 'morning',
              startTime: '10:30',
              endTime: '11:30',
              visitRoom: 'Visit Room 3',
              availableTables: 2,
              capacity: 20,
              sessionConflicts: [],
              disabled: false,
              tag: { text: 'tag text', classes: 'tag-class' },
            },
          ],
          scheduledEvents: [
            {
              daySection: 'afternoon',
              startTime: '14:30',
              endTime: '16:00',
              description: 'Activity - Education 2',
            },
          ],
        },
      ]
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('.bapv-calendar__day-group').length).toBe(2)

      // day with both a morning and afternoon visit session and event
      expect($('.bapv-calendar__day-group').eq(0).find('legend').text().trim()).toBe('Sunday 31 August 2025')
      // Morning - visit session
      expect($('.bapv-calendar__day-group').eq(0).find('h3').eq(0).text()).toBe('Morning')
      expect($('input#date-2025-08-31-morning').val()).toBe('2025-08-31_a')
      expect($('input#date-2025-08-31-morning').prop('disabled')).toBe(false)
      expect($('input#date-2025-08-31-morning').prop('checked')).toBe(false)
      expect($('label[for=date-2025-08-31-morning]').text()).toContain('10am to 11am')
      expect($('label[for=date-2025-08-31-morning]').text()).toContain('Visit Room 1')
      expect($('label[for=date-2025-08-31-morning]').text()).toContain('18 tables available')
      // Morning - event
      expect($('.bapv-calendar__day-group').eq(0).find('h3').eq(1).text()).toBe('Prisoner schedule')
      expect($('.bapv-calendar__day-group').eq(0).find('h3').eq(1).next('.bapv-calendar__event').text()).toContain(
        '9am to 11am',
      )
      expect($('.bapv-calendar__day-group').eq(0).find('h3').eq(1).next('.bapv-calendar__event').text()).toContain(
        'Activity - Education 1',
      )
      // Afternoon - visit session
      expect($('.bapv-calendar__day-group').eq(0).find('h3').eq(2).text()).toBe('Afternoon')
      expect($('input#date-2025-08-31-afternoon').val()).toBe('2025-08-31_b')
      expect($('input#date-2025-08-31-afternoon').prop('disabled')).toBe(true)
      expect($('input#date-2025-08-31-afternoon').prop('checked')).toBe(false)
      expect($('label[for=date-2025-08-31-afternoon]').text()).toContain('1:30pm to 3pm')
      expect($('label[for=date-2025-08-31-afternoon]').text()).toContain('Visit Room 2')
      expect($('label[for=date-2025-08-31-afternoon]').text()).toContain('1 table available')
      // Afternoon - event
      expect($('.bapv-calendar__day-group').eq(0).find('h3').eq(3).text()).toBe('Prisoner schedule')
      expect($('.bapv-calendar__day-group').eq(0).find('h3').eq(3).next('.bapv-calendar__event').text()).toContain(
        '2:30pm to 4pm',
      )
      expect($('.bapv-calendar__day-group').eq(0).find('h3').eq(3).next('.bapv-calendar__event').text()).toContain(
        'Activity - Education 2',
      )

      // day with morning visit and afternoon events, so afternoon section should not render
      expect($('.bapv-calendar__day-group').eq(1).find('legend').text().trim()).toBe('Monday 1 September 2025')
      // Morning - visit session (with tag instead of table availability)
      expect($('.bapv-calendar__day-group').eq(1).find('h3').eq(0).text()).toBe('Morning')
      expect($('input#date-2025-09-01-morning').val()).toBe('2025-09-01_c')
      expect($('input#date-2025-09-01-morning').prop('disabled')).toBe(false)
      expect($('input#date-2025-09-01-morning').prop('checked')).toBe(false)
      expect($('label[for=date-2025-09-01-morning]').text()).toContain('10:30am to 11:30am')
      expect($('label[for=date-2025-09-01-morning]').text()).toContain('Visit Room 3')
      expect($('label[for=date-2025-09-01-morning]').text()).not.toContain('available')
      expect($('label[for=date-2025-09-01-morning]').find('.govuk-tag').text()).toContain('tag text')
      expect($('label[for=date-2025-09-01-morning]').find('.govuk-tag').hasClass('tag-class')).toBe(true)
      // No events or afternoon
      expect($('.bapv-calendar__day-group').eq(1).text()).not.toContain('Prisoner schedule')
      expect($('.bapv-calendar__day-group').eq(1).find('.bapv-calendar__event').length).toBe(0)
    })

    it('should render warning when prisoner events unavailable', () => {
      viewContext.scheduledEventsAvailable = false
      viewContext.calendar = [
        {
          date: '2025-08-31',
          monthHeading: 'August',
          selected: false,
          outline: false,
          visitSessions: [
            {
              date: '2025-08-31',
              sessionTemplateReference: 'a',
              daySection: 'morning',
              startTime: '10:00',
              endTime: '11:00',
              visitRoom: 'Visit Room 1',
              availableTables: 18,
              capacity: 20,
              sessionConflicts: [],
              disabled: false,
            },
          ],
          scheduledEvents: [],
        },
      ]
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-test=prisoner-schedule-unavailable]').text()).toContain('The prisoner schedule is unavailable')
    })

    it('should pre-populate form when returning and value set in formValues', () => {
      viewContext.formValues = { visitSessionId: '2025-08-31_a' }
      viewContext.calendar = [
        {
          date: '2025-08-31',
          monthHeading: 'August',
          selected: false,
          outline: false,
          visitSessions: [
            {
              date: '2025-08-31',
              sessionTemplateReference: 'a',
              daySection: 'morning',
              startTime: '10:00',
              endTime: '11:00',
              visitRoom: 'Visit Room 1',
              availableTables: 18,
              capacity: 20,
              sessionConflicts: [],
              disabled: false,
            },
          ],
          scheduledEvents: [],
        },
      ]
      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('input#date-2025-08-31-morning').prop('checked')).toBe(true)
    })

    it('should render validation errors', () => {
      viewContext.errors = [
        {
          type: 'field',
          msg: 'No visit time selected',
          path: 'date-2025-08-31-morning',
          location: 'body',
        },
      ]
      viewContext.calendar = [
        {
          date: '2025-08-31',
          monthHeading: 'August',
          selected: false,
          outline: false,
          visitSessions: [
            {
              date: '2025-08-31',
              sessionTemplateReference: 'a',
              daySection: 'morning',
              startTime: '10:00',
              endTime: '11:00',
              visitRoom: 'Visit Room 1',
              availableTables: 18,
              capacity: 20,
              sessionConflicts: [],
              disabled: false,
            },
          ],
          scheduledEvents: [],
        },
      ]
      viewContext.firstVisitSessionRadioInputId = 'date-2025-08-31-morning'

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('.govuk-error-summary a[href="#date-2025-08-31-morning-error"]').text()).toBe('No visit time selected')
      expect($('#date-2025-08-31-morning-error').text()).toContain('No visit time selected')
    })
  })
})
