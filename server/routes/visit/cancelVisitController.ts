import { RequestHandler, Request } from 'express'
import { BadRequest } from 'http-errors'
import { body, ValidationChain, validationResult } from 'express-validator'
import { AuditService, VisitService } from '../../services'
import { CancelVisitOrchestrationDto } from '../../data/orchestrationApiTypes'
import { requestMethodsCancellation } from '../../constants/requestMethods'
import { clearSession, getFlashFormValues } from '../visitorUtils'
import { isValidVisitReference } from '../validationChecks'
import visitCancellationReasons from '../../constants/visitCancellationReasons'

export default class CancelVisitController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly visitService: VisitService,
  ) {}

  public cancelConfirmation(): RequestHandler {
    return async (req, res) => {
      clearSession(req)

      return res.render('pages/visit/cancelConfirmation', {
        startTimestamp: req.flash('startTimestamp')?.[0],
        endTimestamp: req.flash('endTimestamp')?.[0],
      })
    }
  }

  public showCancellationReasons(): RequestHandler {
    return async (req, res) => {
      const reference = getVisitReference(req)

      return res.render('pages/visit/cancel', {
        errors: req.flash('errors'),
        reference,
        visitCancellationReasons,
        requestMethodsCancellation,
        formValues: getFlashFormValues(req),
      })
    }
  }

  public cancelVisit(): RequestHandler {
    return async (req, res) => {
      const reference = getVisitReference(req)

      const errors = validationResult(req)
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

      const visit = await this.visitService.cancelVisit({
        username,
        reference,
        cancelVisitDto,
      })

      await this.auditService.cancelledVisit({
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
    }
  }

  public validate(): ValidationChain[] {
    return [
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
    ]
  }
}

function getVisitReference(req: Request): string {
  const { reference } = req.params

  if (!isValidVisitReference(reference)) {
    throw new BadRequest()
  }
  return reference
}
