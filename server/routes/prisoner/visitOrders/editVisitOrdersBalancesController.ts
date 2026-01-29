import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { AuditService, VisitOrdersService } from '../../../services'
import { PVO_MAX, visitBalanceAdjustmentReasons, VO_MAX } from '../../../constants/visitOrders'
import {
  PrisonerBalanceAdjustmentDto,
  PrisonerBalanceAdjustmentReason,
  PrisonerBalanceAdjustmentValidationError,
  PrisonerBalanceAdjustmentValidationErrorResponse,
} from '../../../data/orchestrationApiTypes'
import { SanitisedError } from '../../../sanitisedError'
import { apiValidationErrorToFieldValidationError, transformErrorCodesToMessage } from './visitOrdersUtils'
import { TEXT_INPUT_SINGLE_LINE_REGEX } from '../../validationChecks'

const balanceChangeActions = ['NO_CHANGE', 'ADD', 'REMOVE'] as const
type BalanceChangeActions = (typeof balanceChangeActions)[number]

type EditVisitOrdersFormValues = {
  voChange: BalanceChangeActions
  addVoAmount: number
  removeVoAmount: number
  pvoChange: BalanceChangeActions
  addPvoAmount: number
  removePvoAmount: number
  governorAdjustmentDetails: string
  reason: PrisonerBalanceAdjustmentReason
  otherDetails: string
}

export default class EditVisitOrdersBalancesController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly visitOrdersService: VisitOrdersService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisonerId } = req.params
      const { prisonId } = req.session.selectedEstablishment

      const prisonerVoBalance = await this.visitOrdersService.getVoBalance({
        username: res.locals.user.username,
        prisonId,
        prisonerId,
      })

      // Raw validation errors from flash need to be transformed to include current balances
      const rawErrors = req.flash('errors')
      const errors = rawErrors.map(e => transformErrorCodesToMessage(e, prisonerVoBalance))

      return res.render('pages/prisoner/visitOrders/editVoBalance', {
        errors,
        formValues: req.flash('formValues')?.[0],
        prisonerId,
        prisonerVoBalance,
        visitBalanceAdjustmentReasons,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res, next) => {
      const { prisonerId } = req.params
      const { prisonId } = req.session.selectedEstablishment
      const { username } = res.locals.user

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', req.body)
        return res.redirect(`/prisoner/${prisonerId}/edit-visiting-orders-balances`)
      }

      const data = matchedData<EditVisitOrdersFormValues>(req)

      const prisonerBalanceAdjustmentDto: PrisonerBalanceAdjustmentDto = {
        voAmount: this.getBalanceAdjustment(data.voChange, data.addVoAmount, data.removeVoAmount),
        pvoAmount: this.getBalanceAdjustment(data.pvoChange, data.addPvoAmount, data.removePvoAmount),
        adjustmentReasonType: data.reason,
        adjustmentReasonText: this.getAdjustmentReasonText(data),
        userName: username,
      }

      try {
        await this.visitOrdersService.changeVoBalance({
          username,
          prisonId,
          prisonerId,
          prisonerBalanceAdjustmentDto,
        })

        await this.auditService.adjustedVisitBalance({
          prisonerId,
          voChange: prisonerBalanceAdjustmentDto.voAmount,
          pvoChange: prisonerBalanceAdjustmentDto.pvoAmount,
          reason: prisonerBalanceAdjustmentDto.adjustmentReasonType,
          reasonDetails: prisonerBalanceAdjustmentDto.adjustmentReasonText,
          username,
          operationId: res.locals.appInsightsOperationId,
        })

        return res.redirect(`/prisoner/${prisonerId}#visiting-orders`)
      } catch (error) {
        if (error.status === 422) {
          const validationErrors =
            (error as SanitisedError<PrisonerBalanceAdjustmentValidationErrorResponse>)?.data?.validationErrors ?? []

          // Convert API validation errors to field validation error format for re-display on form
          const fieldValidationErrors = validationErrors.map(e => apiValidationErrorToFieldValidationError(e))

          req.flash('errors', fieldValidationErrors)
          req.flash('formValues', req.body)

          return res.redirect(`/prisoner/${prisonerId}/edit-visiting-orders-balances`)
        }

        return next(error)
      }
    }
  }

  public validate(): ValidationChain[] {
    const selectAtLeastOneChangeMessage = 'Select at least one balance to change.'
    const atLeastZeroMessage = 'Enter a number greater than zero.'
    const enterANumberMessage = 'Enter a number.'
    const enterAReasonMessage = 'Enter a reason for this change.'
    const reasonAllowedCharsMessage =
      'Reason must only include letters, numbers and special characters such as hyphens, apostrophes and brackets'
    const reasonMaxLengthMessage = 'Reason must be 512 characters or less'

    return [
      // VO/PVO change action
      body(['voChange', 'pvoChange']).isIn(balanceChangeActions),

      // At least one of VO/PVO change must be selected
      body('voChange')
        .if(body('pvoChange').equals('NO_CHANGE'))
        .not()
        .equals('NO_CHANGE')
        .withMessage(selectAtLeastOneChangeMessage),
      body('pvoChange')
        .if(body('voChange').equals('NO_CHANGE'))
        .not()
        .equals('NO_CHANGE')
        .withMessage(selectAtLeastOneChangeMessage),

      // VO/PVO min/max validation errors use same error codes as API so they can be
      // transformed in same way by view handler to reflect the current visiting orders balances

      // Add VOs
      body('addVoAmount')
        .toInt()
        .if(body('voChange').equals(<BalanceChangeActions>'ADD'))
        .notEmpty()
        .withMessage(enterANumberMessage)
        .bail()
        .isInt({ min: 1 })
        .withMessage(atLeastZeroMessage)
        .bail()
        .isInt({ max: VO_MAX })
        .withMessage(<PrisonerBalanceAdjustmentValidationError>'VO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX'),

      // Remove VOs
      body('removeVoAmount')
        .toInt()
        .if(body('voChange').equals(<BalanceChangeActions>'REMOVE'))
        .notEmpty()
        .withMessage(enterANumberMessage)
        .bail()
        .isInt({ min: 1 })
        .withMessage(atLeastZeroMessage)
        .bail()
        .isInt({ max: VO_MAX })
        .withMessage(<PrisonerBalanceAdjustmentValidationError>'VO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO'),

      // Add PVOs
      body('addPvoAmount')
        .toInt()
        .if(body('pvoChange').equals(<BalanceChangeActions>'ADD'))
        .notEmpty()
        .withMessage(enterANumberMessage)
        .bail()
        .isInt({ min: 1 })
        .withMessage(atLeastZeroMessage)
        .bail()
        .isInt({ max: PVO_MAX })
        .withMessage(<PrisonerBalanceAdjustmentValidationError>'PVO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX'),

      // Remove PVOs
      body('removePvoAmount')
        .toInt()
        .if(body('pvoChange').equals(<BalanceChangeActions>'REMOVE'))
        .notEmpty()
        .withMessage(enterANumberMessage)
        .bail()
        .isInt({ min: 1 })
        .withMessage(atLeastZeroMessage)
        .bail()
        .isInt({ max: PVO_MAX })
        .withMessage(<PrisonerBalanceAdjustmentValidationError>'PVO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO'),

      // Reason
      body('reason').isIn(Object.keys(visitBalanceAdjustmentReasons)).withMessage('Select a reason.'),
      // Reason optional if 'Governor adjustment' reason selected
      body('governorAdjustmentDetails')
        .if(body('reason').equals(<PrisonerBalanceAdjustmentReason>'GOVERNOR_ADJUSTMENT'))
        .optional({ values: 'falsy' })
        .trim()
        .notEmpty()
        .withMessage(enterAReasonMessage)
        .matches(TEXT_INPUT_SINGLE_LINE_REGEX)
        .withMessage(reasonAllowedCharsMessage)
        .isLength({ max: 512 })
        .withMessage(reasonMaxLengthMessage),
      // Reason required if 'Something else' reason selected
      body('otherDetails')
        .if(body('reason').equals(<PrisonerBalanceAdjustmentReason>'OTHER'))
        .trim()
        .notEmpty()
        .withMessage(enterAReasonMessage)
        .matches(TEXT_INPUT_SINGLE_LINE_REGEX)
        .withMessage(reasonAllowedCharsMessage)
        .isLength({ max: 512 })
        .withMessage(reasonMaxLengthMessage),
    ]
  }

  // Convert 'Add' / 'Remove' amount to single +ve / -ve number
  private getBalanceAdjustment(type: BalanceChangeActions, addAmount: number, removeAmount: number): number {
    if (type === 'NO_CHANGE') {
      return 0
    }

    return type === 'ADD' ? addAmount : -removeAmount
  }

  private getAdjustmentReasonText({
    reason,
    governorAdjustmentDetails,
    otherDetails,
  }: EditVisitOrdersFormValues): string | null {
    if (reason === 'GOVERNOR_ADJUSTMENT') {
      return governorAdjustmentDetails || null
    }

    if (reason === 'OTHER') {
      return otherDetails
    }

    return null
  }
}
