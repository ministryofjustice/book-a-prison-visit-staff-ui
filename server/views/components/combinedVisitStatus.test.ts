import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../utils/nunjucksSetup'

const template = fs.readFileSync('server/views/components/combinedVisitStatus.njk')

let compiledTemplate: Template
let viewContext: Record<string, unknown>

const njkEnv = registerNunjucks()
const nunjucksBaseString = '{% from "components/combinedVisitStatus.njk" import combinedVisitStatus %}'

beforeEach(() => {
  compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
  viewContext = {}
})

describe('combinedVisitStatus(visitSubStatus, visitStatus) macro', () => {
  it('should output visit status if sub status not present', () => {
    viewContext = {
      visitSubStatus: '',
      visitStatus: 'BOOKED',
    }
    const nunjucksString = '{{ combinedVisitStatus(visitSubStatus, visitStatus)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('Booked')
  })

  it('should output visit status if sub status not present', () => {
    viewContext = {
      visitSubStatus: undefined,
      visitStatus: 'BOOKED',
    }
    const nunjucksString = '{{ combinedVisitStatus(visitSubStatus, visitStatus)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('Booked')
  })

  it('should output visit status if sub status is invalid', () => {
    viewContext = {
      visitSubStatus: 'NOT_A_STATUS',
      visitStatus: 'BOOKED',
    }
    const nunjucksString = '{{ combinedVisitStatus(visitSubStatus, visitStatus)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('Booked')
  })

  it('should output sub status of BOOKED if sub status is APPROVED', () => {
    viewContext = {
      visitSubStatus: 'APPROVED',
      visitStatus: 'BOOKED',
    }
    const nunjucksString = '{{ combinedVisitStatus(visitSubStatus, visitStatus)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('Booked')
  })

  it('should output sub status of BOOKED if sub status is AUTO_APPROVED', () => {
    viewContext = {
      visitSubStatus: 'AUTO_APPROVED',
      visitStatus: 'BOOKED',
    }
    const nunjucksString = '{{ combinedVisitStatus(visitSubStatus, visitStatus)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('Booked')
  })

  it('should output sub status of REQUESTED if sub status is REQUESTED', () => {
    viewContext = {
      visitSubStatus: 'REQUESTED',
      visitStatus: 'BOOKED',
    }
    const nunjucksString = '{{ combinedVisitStatus(visitSubStatus, visitStatus)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('Requested')
  })

  it('should output sub status of REJECTED if sub status is REJECTED', () => {
    viewContext = {
      visitSubStatus: 'REJECTED',
      visitStatus: 'CANCELLED',
    }
    const nunjucksString = '{{ combinedVisitStatus(visitSubStatus, visitStatus)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('Rejected')
  })

  it('should output sub status of REJECTED if sub status is AUTO_REJECTED', () => {
    viewContext = {
      visitSubStatus: 'AUTO_REJECTED',
      visitStatus: 'CANCELLED',
    }
    const nunjucksString = '{{ combinedVisitStatus(visitSubStatus, visitStatus)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('Rejected')
  })

  it('should output sub status of CANCELLED if sub status is CANCELLED', () => {
    viewContext = {
      visitSubStatus: 'CANCELLED',
      visitStatus: 'CANCELLED',
    }
    const nunjucksString = '{{ combinedVisitStatus(visitSubStatus, visitStatus)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('Cancelled')
  })

  it('should output sub status of CANCELLED if sub status is WITHDRAWN', () => {
    viewContext = {
      visitSubStatus: 'WITHDRAWN',
      visitStatus: 'CANCELLED',
    }
    const nunjucksString = '{{ combinedVisitStatus(visitSubStatus, visitStatus)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('Cancelled')
  })
})
