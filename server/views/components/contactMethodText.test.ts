import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../utils/nunjucksSetup'

const template = fs.readFileSync('server/views/components/contactMethodText.njk')

let compiledTemplate: Template
let viewContext: Record<string, unknown>

const njkEnv = registerNunjucks()
const nunjucksBaseString = '{% from "components/contactMethodText.njk" import contactMethodText %}'

beforeEach(() => {
  compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
  viewContext = {}
})

describe('contactMethodText(hasEmailAddress, hasMobileNumber) macro', () => {
  it('should output no text', () => {
    viewContext = {
      hasEmailAddress: false,
      hasMobileNumber: false,
    }
    const nunjucksString = '{{ contactMethodText(hasEmailAddress, hasMobileNumber)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe('')
  })

  it('should output email and text message', () => {
    viewContext = {
      hasEmailAddress: true,
      hasMobileNumber: true,
    }
    const nunjucksString = '{{ contactMethodText(hasEmailAddress, hasMobileNumber)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe(
      'The main contact will get an email and a text message to confirm the updated booking. This will include the booking reference.',
    )
  })

  it('should output only email', () => {
    viewContext = {
      hasEmailAddress: true,
      hasMobileNumber: false,
    }
    const nunjucksString = '{{ contactMethodText(hasEmailAddress, hasMobileNumber)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe(
      'The main contact will get an email to confirm the updated booking. This will include the booking reference.',
    )
  })

  it('should output only text message', () => {
    viewContext = {
      hasEmailAddress: false,
      hasMobileNumber: true,
    }
    const nunjucksString = '{{ contactMethodText(hasEmailAddress, hasMobileNumber)  }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text()).toBe(
      'The main contact will get a text message to confirm the updated booking. This will include the booking reference.',
    )
  })
})
