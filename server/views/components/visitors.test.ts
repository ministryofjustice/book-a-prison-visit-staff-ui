import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../utils/nunjucksSetup'

const template = fs.readFileSync('server/views/components/visitors.njk')

let compiledTemplate: Template
let viewContext: Record<string, unknown>

const njkEnv = registerNunjucks()
const nunjucksBaseString = '{% from "components/visitors.njk" import visitorDateOfBirth, visitorRestrictions %}'

beforeEach(() => {
  compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
  viewContext = {}
})

describe('visitorDateOfBirth(visitor) macro', () => {
  const childBirthYear = new Date().getFullYear() - 5
  const adultYear = new Date().getFullYear() - 30

  const adultDob = `${adultYear}-01-01`

  it('should handle missing date of birth', () => {
    const nunjucksString = '{{ visitorDateOfBirth(visitor) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('Not entered')
  })

  it('should format date of birth for an adult', () => {
    viewContext = {
      visitor: {
        dateOfBirth: adultDob,
        adult: true,
      },
    }

    const nunjucksString = '{{ visitorDateOfBirth(visitor) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('body').html()).toBe(`1 January ${adultYear}<br>(30 years old)`)
  })

  it(`should format date of birth for a child (${childBirthYear}-01-01)`, () => {
    viewContext = {
      visitor: {
        dateOfBirth: `${childBirthYear}-01-01`,
        adult: false,
      },
    }

    const nunjucksString = '{{ visitorDateOfBirth(visitor) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('body').html()).toBe(`1 January ${childBirthYear}<br>(5 years old)`)
  })
})

describe('visitorRestrictions(visitor) macro', () => {
  it('should handle visitor with no restrictions', () => {
    const nunjucksString = '{{ visitorRestrictions(visitor) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('None')
  })

  it('should render markup for restrictions and comments', () => {
    viewContext = {
      visitor: {
        restrictions: [
          {
            restrictionType: 'BAN',
            restrictionTypeDescription: 'Banned',
            startDate: '2022-01-01',
            expiryDate: '2022-07-31',
            comment: 'Ban details',
          },
          {
            restrictionType: 'RESTRICTED',
            restrictionTypeDescription: 'Restricted',
            startDate: '2022-01-02',
          },
        ],
      },
    }

    const nunjucksString = '{{ visitorRestrictions(visitor) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.visitor-restriction:nth-child(1) .restriction-tag--BAN').text()).toBe('Banned')
    expect($('.visitor-restriction:nth-child(1)').text()).toContain('Banned until 31 July 2022')
    expect($('.visitor-restriction:nth-child(1)').text()).toContain('See comment')
    expect($('.visitor-restriction:nth-child(1)').text()).toContain('Ban details')

    expect($('.visitor-restriction:nth-child(2) .restriction-tag--RESTRICTED').text()).toBe('Restricted')
    expect($('.visitor-restriction:nth-child(2)').text()).toContain('End date not entered')
  })
})
