/* eslint-disable no-param-reassign */
import nunjucks, { Environment } from 'nunjucks'
import express from 'express'
import { format, parseISO } from 'date-fns'
import path from 'path'
import { FormError } from '../@types/bapv'
import { properCaseFullName } from './utils'
import config from '../config'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Manage prison visits'
  app.locals.dpsHome = config.dpsHome

  // Cachebusting version string
  if (production) {
    // Version only changes on reboot
    app.locals.version = Date.now().toString()
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
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
    ],
    {
      autoescape: true,
      express: app,
      trimBlocks: true,
      lstripBlocks: true,
    },
  )

  njkEnv.addFilter('initialiseName', (fullName: string) => {
    // this check is for the authError page
    if (!fullName) {
      return null
    }
    const array = fullName.split(' ')
    return `${array[0][0]}. ${array.reverse()[0]}`
  })

  njkEnv.addFilter('formatLastNameFirst', (fullName: string) => {
    // this check is for the authError page
    if (!fullName) {
      return null
    }
    const array = fullName.split(' ')
    return `${properCaseFullName(array.at(-1))}, ${properCaseFullName(array[0])}`
  })

  njkEnv.addFilter('properCaseFullName', (name: string) => {
    if (!name) return null
    return properCaseFullName(name)
  })

  njkEnv.addFilter('formatDate', (dateToFormat: string, dateFormat = 'd MMMM yyyy') => {
    if (typeof dateFormat !== 'string') return null
    return dateToFormat ? format(parseISO(dateToFormat), dateFormat) : null
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
        href: `#${errors[error].param}-error`,
      }
    })
  })

  // find specific error and return errorMessage for field validation
  njkEnv.addFilter('findError', (errors, formFieldId) => {
    if (!errors || !formFieldId) return null
    const errorForMessage = errors.find((error: FormError) => error.param === formFieldId)

    if (errorForMessage === undefined) return null

    return {
      text: errorForMessage?.msg,
    }
  })

  return njkEnv
}
