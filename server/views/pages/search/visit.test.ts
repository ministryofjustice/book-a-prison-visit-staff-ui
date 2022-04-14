import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../../utils/nunjucksSetup'

const template = fs.readFileSync('server/views/pages/search/visit.njk')

describe('Views - Visit Search', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
    viewContext = {}
  })

  it('should display the visit search page', () => {
    viewContext = {}

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toEqual('Search for a booking')
    expect($('label[for="searchBlock1"]').text()).toContain('Enter the booking reference')
    expect($('.bapv-visit-search__button').text()).toContain('Search')
  })
})
