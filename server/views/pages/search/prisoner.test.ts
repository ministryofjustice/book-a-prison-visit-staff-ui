import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../../utils/nunjucksSetup'

const template = fs.readFileSync('server/views/pages/search/prisoner.njk')

describe('Views - Prisoner Search', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
    viewContext = {}
  })

  it('should display the prisoner search page', () => {
    viewContext = {}

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toEqual('Search for a prisoner')
    expect($('label[for="search"]').text()).toContain('Enter name or prison number')
    expect($('.moj-search__button').text()).toContain('Search')
  })
})
