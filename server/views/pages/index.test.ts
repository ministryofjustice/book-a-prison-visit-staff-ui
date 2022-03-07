import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../utils/nunjucksSetup'

const template = fs.readFileSync('server/views/pages/index.njk')

describe('Views - Home', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
    viewContext = {}
  })

  it('should display the home page cards', () => {
    viewContext = {}

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-test="book-visit"] .card__link').text()).toEqual('Book a prison visit')
    expect($('[data-test="book-visit"] .card__link').attr('href')).toEqual('/search')

    expect($('[data-test="find-visit"] .card__link').text()).toEqual('Find a booked visit')
  })
})
