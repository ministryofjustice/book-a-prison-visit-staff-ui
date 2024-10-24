/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks, { Environment } from 'nunjucks'
import express from 'express'
import { format, formatDuration, intervalToDuration, isAfter, parseISO } from 'date-fns'
import { FormError } from '../@types/bapv'
import { initialiseName, properCaseFullName } from './utils'
import config from '../config'
import { ApplicationInfo } from '../applicationInfo'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, applicationInfo: ApplicationInfo): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Manage prison visits'
  app.locals.environmentName = config.environmentName
  app.locals.dpsHome = config.dpsHome
  app.locals.dpsPrisoner = config.dpsPrisoner

  // Cachebusting version string
  if (production) {
    // Version only changes on reboot
    app.locals.version = applicationInfo.gitShortHash
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  registerNunjucks(app)
}

export function registerNunjucks(app?: express.Express): Environment {
  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/govuk-frontend/dist/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
      'node_modules/@ministryofjustice/hmpps-connect-dps-components/dist/assets/',
    ],
    {
      autoescape: true,
      express: app,
      trimBlocks: true,
      lstripBlocks: true,
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)

  njkEnv.addFilter('formatLastNameFirst', (fullName: string, properCase = true) => {
    // this check is for the authError page
    if (!fullName) {
      return null
    }

    const array = fullName.split(' ')

    if (properCase) {
      return array.length === 1
        ? properCaseFullName(array[0])
        : `${properCaseFullName(array.at(-1))}, ${properCaseFullName(array[0])}`
    }

    return array.length === 1 ? array[0] : `${array.at(-1)}, ${array[0]}`
  })

  njkEnv.addFilter('properCaseFullName', (name: string) => {
    if (!name) return null
    return properCaseFullName(name)
  })

  njkEnv.addFilter('formatDate', (dateToFormat: string, dateFormat = 'd MMMM yyyy') => {
    if (typeof dateFormat !== 'string') return null
    return dateToFormat ? format(parseISO(dateToFormat), dateFormat) : null
  })

  njkEnv.addFilter('displayAge', (dateOfBirth: string) => {
    const dob = new Date(dateOfBirth)
    const today = new Date()

    if (dob.toString() === 'Invalid Date' || isAfter(dob, today)) {
      return ''
    }

    const duration = intervalToDuration({ start: dob, end: today })

    let age = ''
    if (duration.years) {
      age = formatDuration(duration, { format: ['years'] })
    } else {
      // workaround below for Duration zero/undefined change (https://github.com/date-fns/date-fns/issues/3658)
      age = formatDuration(duration, { format: ['months'] }) || '0 months'
    }

    return `${age} old`
  })

  // format time with minutes only if not on the hour; e.g. 10am / 10:30am
  njkEnv.addFilter('formatTime', (timeToFormat: string) => {
    return timeToFormat ? format(parseISO(timeToFormat), 'h:mmaaa').replace(':00', '') : null
  })

  // convert errors to format for GOV.UK error summary component
  njkEnv.addFilter('errorSummaryList', (errors = []) => {
    return Object.keys(errors).map(error => {
      return {
        text: errors[error].msg,
        href: `#${errors[error].path}-error`,
      }
    })
  })

  // find specific error and return errorMessage for field validation
  njkEnv.addFilter('findError', (errors, formFieldId) => {
    if (!errors || !formFieldId) return null
    const errorForMessage = errors.find((error: FormError) => error.path === formFieldId)

    if (errorForMessage === undefined) return null

    return {
      text: errorForMessage?.msg,
    }
  })

  njkEnv.addFilter('formatTelephone', (telephoneNumber: string) => {
    return telephoneNumber === 'UNKNOWN' || telephoneNumber === undefined ? 'No phone number provided' : telephoneNumber
  })

  njkEnv.addFilter('pluralise', (word, count, plural = `${word}s`) => (count === 1 ? word : plural))

  return njkEnv
}
