import cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from './nunjucksSetup'

describe('Nunjucks Filters', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  describe('initialiseName', () => {
    it('should return null if full name is not provided', () => {
      viewContext = {}
      const nunjucksString = '{{ fullName | initialiseName }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('')
    })

    it('should return formatted name', () => {
      viewContext = {
        fullName: 'Joe Bloggs',
      }
      const nunjucksString = '{{ fullName | initialiseName }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('J. Bloggs')
    })
  })

  describe('formatDate', () => {
    it('should format a date using default format', () => {
      viewContext = {
        date: '2022-02-14T10:00:00',
      }
      const nunjucksString = '{{ date | formatDate }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('14 February 2022')
    })

    it('should format a date using specified format', () => {
      viewContext = {
        date: '2022-02-14T10:00:00',
      }
      const nunjucksString = '{{ date | formatDate("yy MMM d") }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('22 Feb 14')
    })

    it('should handle missing date', () => {
      viewContext = {}
      const nunjucksString = '{{ date | formatDate }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('')
    })
  })

  describe('formatTime', () => {
    it('should format time in 12 hour format with minutes', () => {
      viewContext = {
        timestamp: '2022-02-14T14:30:00',
      }
      const nunjucksString = '{{ timestamp | formatTime }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('2:30pm')
    })

    it('should format time in 12 hour format no minutes for whole hour', () => {
      viewContext = {
        timestamp: '2022-02-14T09:00:00',
      }
      const nunjucksString = '{{ timestamp | formatTime }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('9am')
    })

    it('should handle missing time', () => {
      viewContext = {}
      const nunjucksString = '{{ timestamp | formatTime }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('')
    })
  })

  describe('errorSummaryList', () => {
    it('should map errors to text and href', () => {
      viewContext = {
        errors: [
          {
            msg: 'Field 1 message',
            param: 'field1',
          },
          {
            msg: 'Field 2 message',
            param: 'field2',
          },
        ],
      }
      const nunjucksString = `{% set errorList = errors | errorSummaryList %}
      {% for error in errorList %}
        <span>{{ error.text }}|{{ error.href }}</span>
      {% endfor %}`
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('span').eq(0).text()).toBe('Field 1 message|#field1-error')
      expect($('span').eq(1).text()).toBe('Field 2 message|#field2-error')
    })

    it('should handle empty errors object', () => {
      viewContext = {}
      const nunjucksString = '{{ errors | errorSummaryList }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('')
    })
  })
})
