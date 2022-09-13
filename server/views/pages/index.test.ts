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

  it('should display the home page cards when update journey enabled with Change tile', () => {
    viewContext = {
      updateJourneyEnabled: true,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-test="book-visit"] .card__link').text()).toEqual('Book a visit')
    expect($('[data-test="book-visit"] .card__link').attr('href')).toEqual('/search/prisoner')

    expect($('[data-test="cancel-visit"] .card__link').text()).toEqual('')
    expect($('[data-test="change-visit"] .card__link').text()).toEqual('Change a visit')
    expect($('[data-test="change-visit"] .card__link').attr('href')).toEqual('/search/visit')

    expect($('[data-test="view-visits-by-date"] .card__link').text()).toEqual('View visits by date')
    expect($('[data-test="view-visits-by-date"] .card__link').attr('href')).toEqual('/visits')
  })

  it('should display the home page cards when update journey disabled with Cancel tile', () => {
    viewContext = {
      updateJourneyEnabled: false,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-test="book-visit"] .card__link').text()).toEqual('Book a visit')
    expect($('[data-test="book-visit"] .card__link').attr('href')).toEqual('/search/prisoner')

    expect($('[data-test="change-visit"] .card__link').text()).toEqual('')
    expect($('[data-test="cancel-visit"] .card__link').text()).toEqual('Cancel a visit')
    expect($('[data-test="cancel-visit"] .card__link').attr('href')).toEqual('/search/visit')

    expect($('[data-test="view-visits-by-date"] .card__link').text()).toEqual('View visits by date')
    expect($('[data-test="view-visits-by-date"] .card__link').attr('href')).toEqual('/visits')
  })
})
