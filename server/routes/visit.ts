import type { NextFunction, RequestHandler, Request, Response } from 'express'
import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { BadRequest } from 'http-errors'
import { differenceInCalendarDays } from 'date-fns'
import visitCancellationReasons from '../constants/visitCancellationReasons'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import { CancelVisitOrchestrationDto, IgnoreVisitNotificationsDto } from '../data/orchestrationApiTypes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { isValidVisitReference } from './validationChecks'
import { clearSession, getFlashFormValues } from './visitorUtils'
import { VisitSessionData, VisitSlot } from '../@types/bapv'
import SelectVisitors from './visitJourney/selectVisitors'
import VisitType from './visitJourney/visitType'
import { properCaseFullName } from '../utils/utils'
import DateAndTime from './visitJourney/dateAndTime'
import AdditionalSupport from './visitJourney/additionalSupport'
import CheckYourBooking from './visitJourney/checkYourBooking'
import Confirmation from './visitJourney/confirmation'
import MainContact from './visitJourney/mainContact'
import RequestMethod from './visitJourney/requestMethod'
import sessionCheckMiddleware from '../middleware/sessionCheckMiddleware'
import { type Services } from '../services'
import { requestMethodsCancellation } from '../constants/requestMethods'
import Overbooking from './visitJourney/overbooking'

export default function routes({
  auditService,
  prisonerProfileService,
  prisonerSearchService,
  prisonerVisitorsService,
  supportedPrisonsService,
  visitService,
  visitSessionsService,
  visitNotificationsService,
}: Services): Router {
  const router = Router()

  const get = (path: string, ...handlers: RequestHandler[]) =>
    router.get(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )

  const post = (path: string, ...handlers: RequestHandler[]) =>
    router.post(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )

  get('/cancelled', async (req, res) => {
    clearSession(req)

    return res.render('pages/visit/cancelConfirmation', {
      startTimestamp: req.flash('startTimestamp')?.[0],
      endTimestamp: req.flash('endTimestamp')?.[0],
    })
  })

  post('/:reference', async (req, res) => {
    const reference = getVisitReference(req)
    const { username } = res.locals.user
    // TODO - not really using full visit details here so could request less information
    const {
      visitHistoryDetails: { visit },
    } = await visitService.getFullVisitDetails({
      reference,
      username,
    })

    if (visit.prisonId !== req.session.selectedEstablishment.prisonId) {
      return res.redirect(`/visit/${visit.reference}`)
    }

    const [prisoner, supportedPrisonIds] = await Promise.all([
      prisonerSearchService.getPrisonerById(visit.prisonerId, username),
      supportedPrisonsService.getSupportedPrisonIds(username),
    ])
    const prisonerLocation = getPrisonerLocation(supportedPrisonIds, prisoner)

    const visitorIds = visit.visitors.flatMap(visitor => visitor.nomisPersonId)
    const mainContactVisitor = visit.visitors.find(visitor => visitor.visitContact)
    const mainContactId = mainContactVisitor ? mainContactVisitor.nomisPersonId : null
    const visitorList = await prisonerVisitorsService.getVisitors(visit.prisonerId, username)
    const currentVisitors = visitorList.filter(visitor => visitorIds.includes(visitor.personId))
    const mainContact = currentVisitors.find(visitor => visitor.personId === mainContactId)

    // clean then load session
    clearSession(req)

    const [{ activeAlerts }, restrictions] = await Promise.all([
      prisonerProfileService.getProfile(visit.prisonId, visit.prisonerId, username),
      prisonerProfileService.getRestrictions(visit.prisonerId, username),
    ])
    const visitRestriction =
      visit.visitRestriction === 'OPEN' || visit.visitRestriction === 'CLOSED' ? visit.visitRestriction : undefined
    const visitSlot: VisitSlot = {
      id: '',
      sessionTemplateReference: visit.sessionTemplateReference,
      prisonId: visit.prisonId,
      startTimestamp: visit.startTimestamp,
      endTimestamp: visit.endTimestamp,
      availableTables: 0,
      capacity: undefined,
      visitRoom: visit.visitRoom,
      visitRestriction,
    }
    const visitSessionData: VisitSessionData = {
      allowOverBooking: false,
      prisoner: {
        name: properCaseFullName(`${prisoner.lastName}, ${prisoner.firstName}`),
        offenderNo: prisoner.prisonerNumber,
        dateOfBirth: prisoner.dateOfBirth,
        location: prisonerLocation,
        activeAlerts,
        restrictions,
      },
      visitSlot,
      originalVisitSlot: visitSlot,
      visitRestriction,
      visitors: currentVisitors,
      visitorSupport: visit.visitorSupport ?? { description: '' },
      mainContact: {
        contact: mainContact,
        phoneNumber: visit.visitContact.telephone,
        email: visit.visitContact.email,
        contactName: visit.visitContact.name,
      },
      visitReference: visit.reference,
    }

    req.session.visitSessionData = Object.assign(req.session.visitSessionData ?? {}, visitSessionData)

    const { policyNoticeDaysMin } = req.session.selectedEstablishment

    const numberOfDays = differenceInCalendarDays(new Date(visit.startTimestamp), new Date())

    if (numberOfDays >= policyNoticeDaysMin) {
      return res.redirect(`/visit/${reference}/update/select-visitors`)
    }
    return res.redirect(`/visit/${reference}/update/confirm-update`)
  })

  get('/:reference/clear-notifications', async (req, res) => {
    const reference = getVisitReference(req)

    return res.render('pages/visit/clearNotifications', {
      errors: req.flash('errors'),
      formValues: getFlashFormValues(req),
      backLinkHref: `/visit/${reference}`,
    })
  })

  post(
    '/:reference/clear-notifications',
    body('clearNotifications', 'No answer selected').isIn(['yes', 'no']),
    body('clearReason')
      .if(body('clearNotifications').equals('yes'))
      .trim()
      .notEmpty()
      .withMessage('Enter a reason for not changing the booking')
      .isLength({ max: 512 })
      .withMessage('Reason must be 512 characters or less'),
    async (req, res) => {
      const errors = validationResult(req)
      const reference = getVisitReference(req)
      const { username } = res.locals.user

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array() as [])
        req.flash('formValues', req.body)
        return res.redirect(`/visit/${reference}/clear-notifications`)
      }

      if (req.body.clearNotifications === 'yes') {
        const ignoreVisitNotificationsDto: IgnoreVisitNotificationsDto = {
          reason: req.body.clearReason,
          actionedBy: username,
        }

        const visit = await visitNotificationsService.ignoreNotifications({
          username,
          reference,
          ignoreVisitNotificationsDto,
        })

        await auditService.dismissedNotifications({
          visitReference: reference,
          prisonerId: visit.prisonerId.toString(),
          prisonId: visit.prisonId,
          reason: ignoreVisitNotificationsDto.reason,
          username: ignoreVisitNotificationsDto.actionedBy,
          operationId: res.locals.appInsightsOperationId,
        })
      }

      return res.redirect(`/visit/${reference}`)
    },
  )

  const selectVisitors = new SelectVisitors('update', prisonerVisitorsService)
  const visitType = new VisitType('update', auditService)
  const dateAndTime = new DateAndTime('update', visitService, visitSessionsService, auditService)
  const additionalSupport = new AdditionalSupport('update')
  const mainContact = new MainContact('update', visitService)
  const requestMethod = new RequestMethod('update')
  const checkYourBooking = new CheckYourBooking('update', auditService, visitService)
  const overbooking = new Overbooking('update', visitSessionsService)
  const confirmation = new Confirmation('update')

  get(
    '/:reference/update/select-visitors',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 1 }),
    (req, res) => selectVisitors.get(req, res),
  )
  post(
    '/:reference/update/select-visitors',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 1 }),
    selectVisitors.validate(),
    (req, res) => selectVisitors.post(req, res),
  )

  get(
    '/:reference/update/visit-type',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    (req, res) => visitType.get(req, res),
  )
  post(
    '/:reference/update/visit-type',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    visitType.validate(),
    (req, res) => visitType.post(req, res),
  )

  get(
    '/:reference/update/select-date-and-time',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    (req, res) => dateAndTime.get(req, res),
  )
  post(
    '/:reference/update/select-date-and-time',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    dateAndTime.validate(),
    (req, res) => dateAndTime.post(req, res),
  )

  get(
    '/:reference/update/select-date-and-time/overbooking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    (req, res) => overbooking.viewFromSelectDateTime(req, res),
  )

  post(
    '/:reference/update/select-date-and-time/overbooking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 2 }),
    overbooking.validate(),
    (req, res) => dateAndTime.postOverbookings(req, res),
  )

  get(
    '/:reference/update/additional-support',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 3 }),
    (req, res) => additionalSupport.get(req, res),
  )
  post(
    '/:reference/update/additional-support',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 3 }),
    ...additionalSupport.validate(),
    (req, res) => additionalSupport.post(req, res),
  )

  get(
    '/:reference/update/select-main-contact',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 4 }),
    (req, res) => mainContact.get(req, res),
  )
  post(
    '/:reference/update/select-main-contact',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 4 }),
    ...mainContact.validate(),
    (req, res) => mainContact.post(req, res),
  )

  get(
    '/:reference/update/request-method',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 5 }),
    (req, res) => requestMethod.get(req, res),
  )
  post(
    '/:reference/update/request-method',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 5 }),
    ...requestMethod.validate(),
    (req, res) => requestMethod.post(req, res),
  )

  get(
    '/:reference/update/check-your-booking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 6 }),
    (req, res) => checkYourBooking.get(req, res),
  )
  post(
    '/:reference/update/check-your-booking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 6 }),
    (req, res) => checkYourBooking.post(req, res),
  )

  get(
    '/:reference/update/check-your-booking/overbooking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 6 }),
    (req, res) => overbooking.viewFromCheckBooking(req, res),
  )

  post(
    '/:reference/update/check-your-booking/overbooking',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 6 }),
    overbooking.validate(),
    (req, res) => overbooking.viewFromCheckBooking(req, res),
  )

  get(
    '/:reference/update/confirmation',
    checkVisitReferenceMiddleware,
    sessionCheckMiddleware({ stage: 7 }),
    (req, res) => confirmation.get(req, res),
  )

  get('/:reference/cancel', async (req, res) => {
    const reference = getVisitReference(req)

    return res.render('pages/visit/cancel', {
      errors: req.flash('errors'),
      reference,
      visitCancellationReasons,
      requestMethodsCancellation,
      formValues: getFlashFormValues(req),
    })
  })

  get('/:reference/update/confirm-update', async (req, res) => {
    const reference = getVisitReference(req)
    const { policyNoticeDaysMin } = req.session.selectedEstablishment

    return res.render('pages/visit/confirmUpdate', {
      errors: req.flash('errors'),
      backLinkHref: `/visit/${reference}`,
      policyNoticeDaysMin,
      reference,
    })
  })

  post('/:reference/update/confirm-update', async (req, res) => {
    const reference = getVisitReference(req)
    const { confirmUpdate } = req.body

    if (confirmUpdate === 'yes') {
      req.session.visitSessionData.overrideBookingWindow = true
      return res.redirect(`/visit/${reference}/update/select-visitors`)
    }
    if (confirmUpdate === 'no') {
      return res.redirect(`/visit/${reference}`)
    }

    req.flash('errors', [
      {
        msg: 'No option selected',
        path: 'confirmUpdate',
        type: 'field',
        location: 'body',
      },
    ] as unknown as [])

    return res.redirect(`/visit/${reference}/update/confirm-update`)
  })

  post(
    '/:reference/cancel',
    body('cancel', 'No answer selected').isIn(Object.keys(visitCancellationReasons)),
    body('method', 'No request method selected')
      .if(body('cancel').equals('VISITOR_CANCELLED'))
      .isIn(Object.keys(requestMethodsCancellation)),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Enter a reason for the cancellation')
      .isLength({ max: 512 })
      .withMessage('Reason must be 512 characters or less'),
    async (req, res) => {
      const errors = validationResult(req)
      const reference = getVisitReference(req)
      const { username } = res.locals.user

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array() as [])
        req.flash('formValues', req.body)
        return res.redirect(`/visit/${reference}/cancel`)
      }

      const outcomeStatus = req.body.cancel
      const text = req.body.reason
      const applicationMethodType = outcomeStatus === 'VISITOR_CANCELLED' ? req.body.method : 'NOT_APPLICABLE'

      const cancelVisitDto: CancelVisitOrchestrationDto = {
        cancelOutcome: {
          outcomeStatus,
          text,
        },
        applicationMethodType,
        actionedBy: username,
        userType: 'STAFF',
      }

      const visit = await visitService.cancelVisit({
        username,
        reference,
        cancelVisitDto,
      })

      await auditService.cancelledVisit({
        visitReference: reference,
        prisonerId: visit.prisonerId.toString(),
        prisonId: visit.prisonId,
        reason: `${req.body.cancel}: ${req.body.reason}`,
        username,
        operationId: res.locals.appInsightsOperationId,
      })

      req.flash('startTimestamp', visit.startTimestamp)
      req.flash('endTimestamp', visit.endTimestamp)

      return res.redirect('/visit/cancelled')
    },
  )

  return router
}

function getVisitReference(req: Request): string {
  const { reference } = req.params

  if (!isValidVisitReference(reference)) {
    throw new BadRequest()
  }
  return reference
}

function getPrisonerLocation(supportedPrisonIds: string[], prisoner: Prisoner) {
  if (prisoner.prisonId === 'OUT') {
    return prisoner.locationDescription
  }
  return supportedPrisonIds.includes(prisoner.prisonId) ? `${prisoner.cellLocation}, ${prisoner.prisonName}` : 'Unknown'
}

const checkVisitReferenceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { reference } = req.params

  if (!isValidVisitReference(reference)) {
    throw new BadRequest()
  }

  next()
}
