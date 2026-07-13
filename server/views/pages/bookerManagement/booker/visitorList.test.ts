import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../../../utils/nunjucksSetup'
import TestData from '../../../../routes/testutils/testData'

const template = fs.readFileSync('server/views/pages/bookerManagement/booker/visitorList.njk')

describe('Visitor List', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
    viewContext = {}
  })

  it('should render the contact link correctly', () => {
    viewContext = {
      prisoner: TestData.prisoner(),
      nonLinkedContacts: [TestData.socialContact()],
      dpsContacts: 'dpsContacts',
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    const $linkElement = $('[data-test="visitor-1-contact-link"]')

    expect($linkElement.text().trim()).toBe('View Contact details for Jeanette Smith (opens in a new tab)')

    expect($linkElement.find('a').attr('href')).toBe(
      'dpsContacts/prisoner/A1234BC/contacts/manage/4321/relationship/12345678',
    )

    $linkElement.find('a').first().find('.govuk-visually-hidden').remove()
    expect($linkElement.text().trim()).toBe('View Contact')
  })
})
