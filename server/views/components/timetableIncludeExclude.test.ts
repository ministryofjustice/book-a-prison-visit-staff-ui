import fs from 'fs'
import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../utils/nunjucksSetup'

const template = fs.readFileSync('server/views/components/timetableIncludeExclude.njk')

let compiledTemplate: Template
let viewContext: Record<string, unknown>

const njkEnv = registerNunjucks()
const nunjucksBaseString = '{% from "components/timetableIncludeExclude.njk" import attendees, mergeGroupNames %}'

beforeEach(() => {
  compiledTemplate = nunjucks.compile(template.toString(), njkEnv)
  viewContext = {}
})

describe('attendees(prisonerCategoryGroupNames, prisonerIncentiveLevelGroupNames, prisonerLocationGroupNames, areCategoryGroupsInclusive, areIncentiveGroupsInclusive, areLocationGroupsInclusive) macro', () => {
  it('should handle sessions with no groups', () => {
    const nunjucksString =
      '{{ attendees(prisonerCategoryGroupNames, prisonerIncentiveLevelGroupNames, prisonerLocationGroupNames, areCategoryGroupsInclusive, areIncentiveGroupsInclusive, areLocationGroupsInclusive) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text().trim()).toBe('All prisoners')
  })

  it('should handle sessions with all groups included', () => {
    viewContext = {
      prisonerCategoryGroupNames: ['CategoryGroup'],
      prisonerIncentiveLevelGroupNames: ['IncentiveGroup'],
      prisonerLocationGroupNames: ['LocationGroup'],
      areCategoryGroupsInclusive: true,
      areIncentiveGroupsInclusive: true,
      areLocationGroupsInclusive: true,
    }

    const nunjucksString =
      '{{ attendees(prisonerCategoryGroupNames, prisonerIncentiveLevelGroupNames, prisonerLocationGroupNames, areCategoryGroupsInclusive, areIncentiveGroupsInclusive, areLocationGroupsInclusive) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text().trim()).toBe('CategoryGroup prisoners on IncentiveGroup in LocationGroup')
  })

  it('should handle sessions with all groups excluded', () => {
    viewContext = {
      prisonerCategoryGroupNames: ['CategoryGroup'],
      prisonerIncentiveLevelGroupNames: ['IncentiveGroup'],
      prisonerLocationGroupNames: ['LocationGroup'],
      areCategoryGroupsInclusive: false,
      areIncentiveGroupsInclusive: false,
      areLocationGroupsInclusive: false,
    }

    const nunjucksString =
      '{{ attendees(prisonerCategoryGroupNames, prisonerIncentiveLevelGroupNames, prisonerLocationGroupNames, areCategoryGroupsInclusive, areIncentiveGroupsInclusive, areLocationGroupsInclusive) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($.text().trim()).toBe(
      'All prisoners except CategoryGroup prisoners, prisoners on IncentiveGroup and prisoners in LocationGroup',
    )
  })
})

describe('mergeGroupNames(groupNames) macro', () => {
  it('should return "name" if one present', () => {
    viewContext = { groupNames: ['Group name 1'] }
    const nunjucksString = '{{ mergeGroupNames(groupNames) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('body').html()).toBe('Group name 1')
  })
  it('should return "name and name" if two present', () => {
    viewContext = { groupNames: ['Group name 1', 'Group name 2'] }
    const nunjucksString = '{{ mergeGroupNames(groupNames) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('body').html()).toBe('Group name 1 and Group name 2')
  })

  it('should return "name, name and name" if three are present', () => {
    viewContext = { groupNames: ['Group name 1', 'Group name 2', 'Group name 3'] }
    const nunjucksString = '{{ mergeGroupNames(groupNames) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('body').html()).toBe('Group name 1, Group name 2 and Group name 3')
  })

  it('should return "name, name, name and name" if four or more are present', () => {
    viewContext = { groupNames: ['Group name 1', 'Group name 2', 'Group name 3', 'Group name 4'] }
    const nunjucksString = '{{ mergeGroupNames(groupNames) }}'
    compiledTemplate = nunjucks.compile(nunjucksBaseString + nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('body').html()).toBe('Group name 1, Group name 2, Group name 3 and Group name 4')
  })
})
