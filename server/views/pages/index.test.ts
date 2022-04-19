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

    expect($('[data-test="book-visit"] .card__link').text()).toEqual('Book a visit')
    expect($('[data-test="book-visit"] .card__link').attr('href')).toEqual('/search/prisoner')

    expect($('[data-test="cancel-visit"] .card__link').text()).toEqual('Cancel a visit')
    expect($('[data-test="cancel-visit"] .card__link').attr('href')).toEqual('/search/visit')
  })
})
