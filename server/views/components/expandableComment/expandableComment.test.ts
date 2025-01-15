import nunjucks, { Template } from 'nunjucks'
import * as cheerio from 'cheerio'
import { registerNunjucks } from '../../../utils/nunjucksSetup'

describe('Expandable comment component', () => {
  const njkEnv = registerNunjucks()
  const templateString = `
{%- from "components/expandableComment/macro.njk" import bapvExpandableComment -%}
{{- bapvExpandableComment(comment) -}}`

  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  beforeEach(() => {
    viewContext = {}
  })

  it('should handle missing input', () => {
    compiledTemplate = nunjucks.compile(templateString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('body span').html()).toBe('')
  })

  it('should trim input and not render additional markup if no newline within the text', () => {
    viewContext = {
      comment: { text: ' \na string with no newline in the text \r\n' },
    }
    compiledTemplate = nunjucks.compile(templateString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('body span').html().trim()).toBe('a string with no newline in the text')
  })

  it('should split on first newline and add expandable comment markup', () => {
    viewContext = {
      comment: { text: 'line one\nline two\nline three' },
    }
    compiledTemplate = nunjucks.compile(templateString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.bapv-expandable-comment').length).toBe(1)
    expect($('.bapv-expandable-comment__first-line').text()).toBe('line one')
    expect($('.bapv-expandable-comment__show').length).toBe(1)
    expect($('.bapv-expandable-comment__full-comment').text()).toBe('line two\nline three')
    expect($('.bapv-expandable-comment__hide').length).toBe(1)
  })
})
