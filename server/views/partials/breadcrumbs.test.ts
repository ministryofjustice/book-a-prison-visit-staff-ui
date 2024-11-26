import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { registerNunjucks } from '../../utils/nunjucksSetup'
import config from '../../config'

describe('Breadcrumbs', () => {
  const njkEnv = registerNunjucks()
  const viewContext = {
    applicationName: config.applicationName,
    dpsHome: config.dpsHome,
  }
  let template: string

  beforeEach(() => {
    template = '{% from "partials/breadcrumbs.njk" import breadcrumbs with context %}'
  })

  it('should render breadcrumbs with DPS and service name by default', () => {
    template += '{{ breadcrumbs() }}'

    const compiledTemplate = nunjucks.compile(template, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-breadcrumbs li').length).toBe(2)

    expect($('.govuk-breadcrumbs li:first a').text()).toBe('Digital Prison Services')
    expect($('.govuk-breadcrumbs li:first a').attr('href')).toBe(config.dpsHome)

    expect($('.govuk-breadcrumbs li:nth-child(2) a').text()).toBe('Manage prison visits')
    expect($('.govuk-breadcrumbs li:nth-child(2) a').attr('href')).toBe('/')
  })

  it('should render breadcrumbs with DPS only if showServiceName is false', () => {
    template += '{{ breadcrumbs(false) }}'

    const compiledTemplate = nunjucks.compile(template, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-breadcrumbs li').length).toBe(1)

    expect($('.govuk-breadcrumbs li:first a').text()).toBe('Digital Prison Services')
    expect($('.govuk-breadcrumbs li:first a').attr('href')).toBe(config.dpsHome)
  })

  it('should render breadcrumbs, with service name and additional breadcrumb', () => {
    template += '{{ breadcrumbs(true, [{ title: "Test", href: "/test" }]) }}'

    const compiledTemplate = nunjucks.compile(template, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-breadcrumbs li').length).toBe(3)

    expect($('.govuk-breadcrumbs li:first a').text()).toBe('Digital Prison Services')
    expect($('.govuk-breadcrumbs li:first a').attr('href')).toBe(config.dpsHome)

    expect($('.govuk-breadcrumbs li:nth-child(2) a').text()).toBe('Manage prison visits')
    expect($('.govuk-breadcrumbs li:nth-child(2) a').attr('href')).toBe('/')

    expect($('.govuk-breadcrumbs li:nth-child(3) a').text()).toBe('Test')
    expect($('.govuk-breadcrumbs li:nth-child(3) a').attr('href')).toBe('/test')
  })
})
