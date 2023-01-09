import cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from './nunjucksSetup'

describe('Nunjucks Filters', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  describe('formatLastNameFirst', () => {
    it('should return null if full name is not provided', () => {
      viewContext = {}
      const nunjucksString = '{{ fullName | formatLastNameFirst }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('')
    })

    describe('with proper case', () => {
      it('should return formatted contact', () => {
        viewContext = {
          fullName: 'JOE BLOGGS',
        }
        const nunjucksString = '{{ fullName | formatLastNameFirst }}'
        compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
        const $ = cheerio.load(compiledTemplate.render(viewContext))
        expect($('body').text()).toBe('Bloggs, Joe')
      })

      it('should handle contact with middle name', () => {
        viewContext = {
          fullName: 'ONE TWO THREE',
        }
        const nunjucksString = '{{ fullName | formatLastNameFirst }}'
        compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
        const $ = cheerio.load(compiledTemplate.render(viewContext))
        expect($('body').text()).toBe('Three, One')
      })

      it('should return formatted contact with one name', () => {
        viewContext = {
          fullName: 'JOE',
        }
        const nunjucksString = '{{ fullName | formatLastNameFirst }}'
        compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
        const $ = cheerio.load(compiledTemplate.render(viewContext))
        expect($('body').text()).toBe('Joe')
      })
    })

    describe('without proper case', () => {
      it('should return formatted contact', () => {
        viewContext = {
          fullName: 'JOE BLOGGS',
        }
        const nunjucksString = '{{ fullName | formatLastNameFirst(false) }}'
        compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
        const $ = cheerio.load(compiledTemplate.render(viewContext))
        expect($('body').text()).toBe('BLOGGS, JOE')
      })

      it('should handle contact with middle name', () => {
        viewContext = {
          fullName: 'ONE TWO THREE',
        }
        const nunjucksString = '{{ fullName | formatLastNameFirst(false) }}'
        compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
        const $ = cheerio.load(compiledTemplate.render(viewContext))
        expect($('body').text()).toBe('THREE, ONE')
      })

      it('should return formatted contact with one name', () => {
        viewContext = {
          fullName: 'JOE',
        }
        const nunjucksString = '{{ fullName | formatLastNameFirst(false) }}'
        compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
        const $ = cheerio.load(compiledTemplate.render(viewContext))
        expect($('body').text()).toBe('JOE')
      })
    })
  })

  describe('properCaseFullName', () => {
    it('should return null if name is not provided', () => {
      viewContext = {}
      const nunjucksString = '{{ fullName | properCaseFullName }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('')
    })

    it('should return formatted contact', () => {
      viewContext = {
        fullName: 'JOE BLOGGS',
      }
      const nunjucksString = '{{ fullName | properCaseFullName }}'
      compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect($('body').text()).toBe('Joe Bloggs')
    })
  })

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

  describe('displayAge', () => {
    beforeAll(() => {
      const fakeDate = new Date('2020-12-14')
      jest.useFakeTimers({ doNotFake: ['nextTick'], now: fakeDate })
    })
    afterAll(() => {
      jest.useRealTimers()
    })
    ;[
      { input: '2025-11-15', expected: '' },
      { input: '2020-11-15', expected: '0 months old' },
      { input: '2020-11-14', expected: '1 month old' },
      { input: '2020-10-15', expected: '1 month old' },
      { input: '2020-10-14', expected: '2 months old' },
      { input: '2020-10-13', expected: '2 months old' },
      { input: '2019-12-15', expected: '11 months old' },
      { input: '2019-12-14', expected: '1 year old' },
      { input: '2018-12-15', expected: '1 year old' },
      { input: '2018-12-14', expected: '2 years old' },
      { input: '2017-12-15', expected: '2 years old' },
      { input: '2010-12-14', expected: '10 years old' },
      { input: '', expected: '' },
    ].forEach(testData => {
      it(`should output ${testData.expected} when supplied with ${testData.input}`, () => {
        const dateOfBirth = new Date(testData.input)
        viewContext = {
          dateOfBirth,
        }
        const nunjucksString = '{{ dateOfBirth | displayAge }}'
        compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
        const $ = cheerio.load(compiledTemplate.render(viewContext))
        expect($('body').text()).toBe(testData.expected)
      })
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
