import { Router } from 'express'
import { body, validationResult, oneOf } from 'express-validator'
import { getParsedDateFromQueryString } from '../../utils/utils'
import { getDateTabs, getSelectedOrDefaultSessionSchedule, getSessionsSideNav } from './visitsUtils'
import type { Services } from '../../services'
import { getFlashFormValues } from '../visitorUtils'
import { VisitPreview, VisitRestriction } from '../../data/orchestrationApiTypes'

export default function routes({
  auditService,
  blockedDatesService,
  visitNotificationsService,
  visitService,
  visitSessionsService,
}: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const { prisonId } = req.session.selectedEstablishment
    const { username } = res.locals.user

    const { sessionReference = '', selectedDate = '', firstTabDate = '' } = req.query

    const selectedSessionReference = sessionReference.toString()
    const selectedDateString = getParsedDateFromQueryString(selectedDate.toString())
    const firstTabDateString = getParsedDateFromQueryString(firstTabDate.toString())

    // get selected day's session schedules and any 'unknown' visits (migrated data with no session template)
    const [sessionSchedulesForDay, unknownVisits] = await Promise.all([
      visitSessionsService.getSessionSchedule({
        username,
        prisonId,
        date: selectedDateString,
      }),
      visitService.getVisitsWithoutSessionTemplate({
        username,
        prisonId,
        sessionDate: selectedDateString,
      }),
    ])

    // identify if a session schedule has been selected or can be defaulted
    const sessionSchedule = getSelectedOrDefaultSessionSchedule(
      sessionSchedulesForDay,
      selectedSessionReference,
      unknownVisits,
    )

    // side nav comprises sessions in schedule and those derived from 'unknown' visits
    const sessionsSideNav = getSessionsSideNav(
      sessionSchedulesForDay,
      unknownVisits,
      selectedDateString,
      firstTabDateString,
      sessionSchedule?.sessionTemplateReference || selectedSessionReference,
    )

    // data structure for any possible set of visits
    const visits: Record<VisitRestriction, { numVisitors: number; visits: VisitPreview[] }> = {
      CLOSED: { numVisitors: 0, visits: [] },
      OPEN: { numVisitors: 0, visits: [] },
      UNKNOWN: { numVisitors: 0, visits: [] },
    }

    // fetch visits if a known session is selected and split into open/closed
    if (sessionSchedule) {
      const openAndClosedVisits = await visitService.getVisitsBySessionTemplate({
        username,
        prisonId,
        reference: sessionSchedule.sessionTemplateReference,
        sessionDate: selectedDateString,
      })

      openAndClosedVisits.forEach(visit => {
        visits[visit.visitRestriction].visits.push(visit)
        visits[visit.visitRestriction].numVisitors += visit.visitorCount
      })
    }

    // if there are unknown visits, filter these by the selected time slot reference
    const selectedTimeSlotRef = sessionsSideNav.get('All visits')?.find(s => s.active)?.reference
    if (selectedTimeSlotRef) {
      unknownVisits.forEach(visit => {
        if (`${visit.visitTimeSlot.startTime}-${visit.visitTimeSlot.endTime}` === selectedTimeSlotRef) {
          visits.UNKNOWN.visits.push(visit)
          visits.UNKNOWN.numVisitors += visit.visitorCount
        }
      })
    }

    // if no visits, check if this is an exclude date - and if so are there any notifications
    const areNoVisits = !Object.keys(visits).some((visitType: keyof typeof visits) => visits[visitType].visits.length)
    const isAnExcludeDate =
      areNoVisits && (await blockedDatesService.isBlockedDate(prisonId, selectedDateString, username))
    const isAnExcludeDateWithVisitNotifications =
      isAnExcludeDate && (await visitNotificationsService.dateHasNotifications(username, prisonId, selectedDateString))

    const queryParamsForBackLink = new URLSearchParams({
      query: new URLSearchParams({
        sessionReference: sessionSchedule?.sessionTemplateReference || selectedTimeSlotRef || 'NONE',
        selectedDate: selectedDateString,
        firstTabDate: firstTabDateString,
      }).toString(),
      from: 'visits',
    }).toString()

    await auditService.viewedVisits({
      viewDate: selectedDateString,
      prisonId,
      username,
      operationId: res.locals.appInsightsOperationId,
    })

    return res.render('pages/visitsByDate/visitsByDate', {
      errors: req.flash('errors'),
      formValues: getFlashFormValues(req),
      dateTabs: getDateTabs(selectedDateString, firstTabDateString, 3),
      sessionSchedule,
      sessionsSideNav,
      queryParamsForBackLink,
      visits,
      isAnExcludeDate,
      isAnExcludeDateWithVisitNotifications,
    })
  })

  // New datepicker will return 1/1/2024 - 11/1/2024 - 1/11/2024 - 11/11/2024
  // Previously only returned 2 digits, 01/01/2024 etc
  router.post('/', async (req, res) => {
    await oneOf(
      [
        body('date').isDate({ format: 'D/M/YYYY' }),
        body('date').isDate({ format: 'DD/M/YYYY' }),
        body('date').isDate({ format: 'D/MM/YYYY' }),
        body('date').isDate({ format: 'DD/MM/YYYY' }),
      ],
      {
        message: 'Enter a valid date',
      },
    ).run(req)

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
