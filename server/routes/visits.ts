import { type RequestHandler, Router } from 'express'
import { body, validationResult } from 'express-validator'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { getParsedDateFromQueryString } from '../utils/utils'
import { getDateTabs, getSelectedOrDefaultSessionTemplate, getSessionsSideNav } from './visitsUtils'
import type { Services } from '../services'
import { getFlashFormValues } from './visitorUtils'
import { VisitPreview, VisitRestriction } from '../data/orchestrationApiTypes'

export default function routes({
  auditService,
  supportedPrisonsService,
  visitNotificationsService,
  visitService,
  visitSessionsService,
}: Services): Router {
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

    const selectedSessionReference = sessionReference.toString()
    const selectedType: VisitRestriction = type === 'OPEN' || type === 'CLOSED' || type === 'UNKNOWN' ? type : undefined
    const selectedDateString = getParsedDateFromQueryString(selectedDate.toString())
    const firstTabDateString = getParsedDateFromQueryString(firstTabDate.toString())

    // get session schedule and any 'unknown' visits (i.e. those with no session template because migrated data)
    const [sessionSchedule, unknownVisits] = await Promise.all([
      visitSessionsService.getSessionSchedule({
        username: res.locals.user.username,
        prisonId,
        date: selectedDateString,
      }),
      visitService.getVisitsWithoutSessionTemplate({
        username: res.locals.user.username,
        prisonId,
        sessionDate: selectedDateString,
      }),
    ])

    // identify if a session template in the schedule has been selected or can be defaulted
    const selectedSessionTemplate = getSelectedOrDefaultSessionTemplate(
      sessionSchedule,
      selectedSessionReference,
      selectedType,
    )

    // side nav comprises sessions in schedule and those derived from 'unknown' visits
    const sessionsSideNav = getSessionsSideNav(
      sessionSchedule,
      unknownVisits,
      selectedDateString,
      firstTabDateString,
      selectedSessionTemplate?.sessionReference || selectedSessionReference,
      selectedSessionTemplate?.type || selectedType,
    )

    let visits: VisitPreview[] = []

    // fetch visits if a known session is selected...
    if (selectedSessionTemplate) {
      visits = await visitService.getVisitsBySessionTemplate({
        username: res.locals.user.username,
        prisonId,
        reference: selectedSessionTemplate.sessionReference,
        sessionDate: selectedDateString,
        visitRestrictions: selectedSessionTemplate.type,
      })
    }

    // ...otherwise if there are unknown visits then filter these by the selected time slot
    const selectedTimeSlotRef = sessionsSideNav.unknown?.find(s => s.active)?.reference
    if (!selectedSessionTemplate && selectedTimeSlotRef) {
      visits = unknownVisits.filter(
        visit => selectedTimeSlotRef === `${visit.visitTimeSlot.startTime}-${visit.visitTimeSlot.endTime}`,
      )
    }

    // if no visits, check if this is an exclude date - and if so are there any notifications
    const isAnExcludeDate =
      visits.length === 0 &&
      (await supportedPrisonsService.isAnExcludeDate(res.locals.user.username, prisonId, selectedDateString))
    const isAnExcludeDateWithVisitNotifications =
      isAnExcludeDate &&
      (await visitNotificationsService.dateHasNotifications(res.locals.user.username, prisonId, selectedDateString))

    const visitorsTotal = visits.reduce((acc, visit) => {
      return acc + visit.visitorCount
    }, 0)

    const queryParamsForBackLink = new URLSearchParams({
      query: new URLSearchParams({
        type: selectedSessionTemplate?.type || 'UNKNOWN',
        sessionReference: selectedSessionTemplate?.sessionReference || selectedTimeSlotRef || 'NONE',
        selectedDate: selectedDateString,
        firstTabDate: firstTabDateString,
      }).toString(),
      from: 'visits',
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
      selectedSessionTemplate,
      sessionsSideNav,
      queryParamsForBackLink,
      visits,
      visitorsTotal,
      isAnExcludeDate,
      isAnExcludeDateWithVisitNotifications,
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
