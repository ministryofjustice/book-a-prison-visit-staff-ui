import { type RequestHandler, Router } from 'express'
import { body, validationResult } from 'express-validator'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { getParsedDateFromQueryString } from '../utils/utils'
import { getDateTabs, getSelectedOrDefaultSession, getSessionsSideNav } from './visitsUtils'
import type { Services } from '../services'
import { getFlashFormValues } from './visitorUtils'
import { VisitRestriction } from '../data/orchestrationApiTypes'

export default function routes({ auditService, visitService, visitSessionsService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], ...handlers: RequestHandler[]) =>
    router.get(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )
  const post = (path: string | string[], ...handlers: RequestHandler[]) =>
    router.post(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )

  get('/', async (req, res) => {
    const { prisonId } = req.session.selectedEstablishment

    const { type = '', sessionReference = '', selectedDate = '', firstTabDate = '' } = req.query

    const selectedType: VisitRestriction = type === 'OPEN' || type === 'CLOSED' || type === 'UNKNOWN' ? type : 'OPEN'
    const selectedDateString = getParsedDateFromQueryString(selectedDate.toString())
    const firstTabDateString = getParsedDateFromQueryString(firstTabDate.toString())

    const sessionSchedule = await visitSessionsService.getSessionSchedule({
      username: res.locals.user.username,
      prisonId,
      date: selectedDateString,
    })

    const selectedSession = getSelectedOrDefaultSession(sessionSchedule, sessionReference.toString(), selectedType)

    const sessionsSideNav = getSessionsSideNav(
      sessionSchedule,
      selectedDateString,
      firstTabDateString,
      selectedSession?.sessionReference,
      selectedSession?.type,
    )

    const visits = selectedSession
      ? await visitService.getVisitsBySessionTemplate({
          username: res.locals.user.username,
          reference: selectedSession.sessionReference,
          sessionDate: selectedDateString,
          visitRestrictions: selectedSession.type,
        })
      : []

    const visitorsTotal = visits.reduce((acc, visit) => {
      return acc + visit.visitorCount
    }, 0)

    const queryParamsForBackLink = new URLSearchParams({
      query: new URLSearchParams({
        type: selectedSession?.type,
        sessionReference: selectedSession?.sessionReference,
        selectedDate: selectedDateString,
        firstTabDate: firstTabDateString,
      }).toString(),
      from: 'visit-search',
    }).toString()

    await auditService.viewedVisits({
      viewDate: selectedDateString,
      prisonId,
      username: res.locals.user.username,
      operationId: res.locals.appInsightsOperationId,
    })

    return res.render('pages/visits/summary', {
      errors: req.flash('errors'),
      formValues: getFlashFormValues(req),
      dateTabs: getDateTabs(selectedDateString, firstTabDateString, 3),
      selectedSession,
      sessionsSideNav,
      queryParamsForBackLink,
      visits,
      visitorsTotal,
    })
  })

  post('/', async (req, res) => {
    await body('date').isDate({ format: 'DD/MM/YYYY', strictMode: true }).withMessage('Enter a valid date').run(req)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      req.flash('formValues', req.body)
      return res.redirect('/visits')
    }

    const date: string[] = req.body.date.split('/')
    const day = date[0]
    const month = date[1]
    const year = date[2]

    const selectedDateString = getParsedDateFromQueryString(`${year}-${month}-${day}`)
    const queryParams = new URLSearchParams({
      selectedDate: selectedDateString,
      firstTabDate: selectedDateString,
    }).toString()

    return res.redirect(`/visits?${queryParams}`)
  })

  return router
}
