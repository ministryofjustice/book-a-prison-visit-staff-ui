import { RequestHandler } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { AuditService, VisitNotificationsService } from '../../services'
import { VisitReferenceParams } from '../../@types/requestParameterTypes'
import { IgnoreVisitNotificationsDto } from '../../data/orchestrationApiTypes'
import { getFlashFormValues } from '../visitorUtils'

export default class ClearNotificationsController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly visitNotificationsService: VisitNotificationsService,
  ) {}

  public view(): RequestHandler<VisitReferenceParams> {
    return async (req, res) => {
      const { reference } = req.params

      return res.render('pages/visit/clearNotifications', {
        errors: req.flash('errors'),
        formValues: getFlashFormValues(req),
        backLinkHref: `/visit/${reference}`,
      })
    }
  }

  public clearNotifications(): RequestHandler<VisitReferenceParams> {
    return async (req, res) => {
      const errors = validationResult(req)
      const { reference } = req.params
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

        const visit = await this.visitNotificationsService.ignoreNotifications({
          username,
          reference,
          ignoreVisitNotificationsDto,
        })

        await this.auditService.dismissedNotifications({
          visitReference: reference,
          prisonerId: visit.prisonerId.toString(),
          prisonId: visit.prisonId,
          reason: ignoreVisitNotificationsDto.reason,
          username: ignoreVisitNotificationsDto.actionedBy,
          operationId: res.locals.appInsightsOperationId,
        })
      }

      return res.redirect(`/visit/${reference}`)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('clearNotifications', 'No answer selected').isIn(['yes', 'no']),
      body('clearReason')
        .if(body('clearNotifications').equals('yes'))
        .trim()
        .notEmpty()
        .withMessage('Enter a reason for not changing the booking')
        .isLength({ max: 512 })
        .withMessage('Reason must be 512 characters or less'),
    ]
  }
}
