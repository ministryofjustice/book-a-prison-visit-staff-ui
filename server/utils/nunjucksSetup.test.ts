import * as cheerio from 'cheerio'
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

  describe('displayAge', () => {
    beforeAll(() => {
      const fakeDate = new Date('2020-12-14T12:00:00')
      jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })
    })
    afterAll(() => {
      jest.useRealTimers()
    })
    ;[
      { input: '3025-11-15', expected: '' }, // future date of birth
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
      { input: 'random string', expected: '' },
    ].forEach(testData => {
      it(`should output '${testData.expected}' when supplied with '${testData.input}'`, () => {
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
            path: 'field1',
            type: 'field',
          },
          {
            msg: 'Field 2 message',
            path: 'field2',
            type: 'field',
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

  describe('pluralise', () => {
    describe('Regular plurals', () => {
      it('should return plural form when count is 0', () => {
        compiledTemplate = nunjucks.compile('{{ "table" | pluralise(0) }}', njkEnv)
        const $ = cheerio.load(compiledTemplate.render())
        expect($('body').text()).toBe('tables')
      })

      it('should return singular form when count is 1', () => {
        compiledTemplate = nunjucks.compile('{{ "table" | pluralise(1) }}', njkEnv)
        const $ = cheerio.load(compiledTemplate.render())
        expect($('body').text()).toBe('table')
      })

      it('should return plural form when count is 2', () => {
        compiledTemplate = nunjucks.compile('{{ "table" | pluralise(2) }}', njkEnv)
        const $ = cheerio.load(compiledTemplate.render())
        expect($('body').text()).toBe('tables')
      })
    })

    describe('Irregular plurals', () => {
      it('should return plural form when count is 0', () => {
        compiledTemplate = nunjucks.compile('{{ "child" | pluralise(0, "children") }}', njkEnv)
        const $ = cheerio.load(compiledTemplate.render())
        expect($('body').text()).toBe('children')
      })

      it('should return singular form when count is 1', () => {
        compiledTemplate = nunjucks.compile('{{ "child" | pluralise(1, "children") }}', njkEnv)
        const $ = cheerio.load(compiledTemplate.render())
        expect($('body').text()).toBe('child')
      })

      it('should return plural form when count is 2', () => {
        compiledTemplate = nunjucks.compile('{{ "child" | pluralise(2, "children") }}', njkEnv)
        const $ = cheerio.load(compiledTemplate.render())
        expect($('body').text()).toBe('children')
      })
    })
  })

  describe('splitOnNewline', () => {
    it('should handle null or undefined', () => {
      const expectedResult = ['', '']

      expect(njkEnv.getFilter('splitOnNewline')(null)).toStrictEqual(expectedResult)
      expect(njkEnv.getFilter('splitOnNewline')(undefined)).toStrictEqual(expectedResult)
    })

    it('should handle a string with no newline', () => {
      const input = 'a string with no newline '
      const expectedResult = ['a string with no newline', '']

      const result = njkEnv.getFilter('splitOnNewline')(input)
      expect(result).toStrictEqual(expectedResult)
    })

    it('should trim and ignore leading or trailing newlines or whitespace', () => {
      const input = ' \r\n a string with leading and trailing whitespace\n '
      const expectedResult = ['a string with leading and trailing whitespace', '']

      const result = njkEnv.getFilter('splitOnNewline')(input)
      expect(result).toStrictEqual(expectedResult)
    })

    it('should split on first non-leading newline and keep subsequent newlines', () => {
      const input = ' \n line one\n\nline two\n\nline three \n\n '
      const expectedResult = ['line one', 'line two\n\nline three']

      const result = njkEnv.getFilter('splitOnNewline')(input)
      expect(result).toStrictEqual(expectedResult)
    })
  })

  // implemented own mojDate filter, as chosen a specific return format
  describe('mojDate', () => {
    it('should handle null or undefined', () => {
      expect(njkEnv.getFilter('mojDate')(null)).toStrictEqual(null)
      expect(njkEnv.getFilter('mojDate')(undefined)).toStrictEqual(null)
    })

    it('should correctly format date and time', () => {
      const input = '2024-12-20T13:32:00.000Z'
      const expectedResult = 'Friday 20 December 2024 at 1:32pm'

      const result = njkEnv.getFilter('mojDate')(input)
      expect(result).toStrictEqual(expectedResult)
    })

    it('should correctly format date and time, and remove :00', () => {
      const input = '2024-12-25T17:00:00.000Z'
      const expectedResult = 'Wednesday 25 December 2024 at 5pm'

      const result = njkEnv.getFilter('mojDate')(input)
      expect(result).toStrictEqual(expectedResult)
    })
  })
})
