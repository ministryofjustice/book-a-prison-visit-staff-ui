import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { AuditService, VisitAllowanceService } from '../../services'
import { properCase } from '../../utils/utils'

export default class UpdatesAllowancesController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly visitAllowanceService: VisitAllowanceService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisonId } = req.session.selectedEstablishment

      const remandConfig = await this.visitAllowanceService.getRemandConfig({
        username: res.locals.user.username,
        prisonId,
      })

      const formValues = {
        weekStartDay: remandConfig.weekStartDay,
        remandVisitLimitPerWeek: remandConfig.remandVisitLimitPerWeek,
        ...req.flash('formValues')?.[0],
      }

      return res.render('pages/visitAllowances/remand', {
        formValues,
        errors: req.flash('errors'),
      })
    }
  }

  public change(): RequestHandler {
    return async (req, res) => {
      const { username } = res.locals.user
      const { prisonId } = req.session.selectedEstablishment
      const { weekStartDay, remandVisitLimitPerWeek } = req.body

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))
        return res.redirect('/visit-allowances/remand')
      }

      await this.visitAllowanceService.updateRemandConfig({
        username: res.locals.user.username,
        prisonId,
        weekStartDay,
        remandVisitLimitPerWeek,
      })

      await this.auditService.updatedPrisonAllowances({
        prisonId,
        weekStartDay,
        remandVisitLimitPerWeek,
        username,
        operationId: res.locals.appInsightsOperationId,
      })

      req.flash('messages', {
        variant: 'success',
        title: 'Visit allowances updated',
        text: `${remandVisitLimitPerWeek} visits every 7 days. This allowance renews on ${properCase(weekStartDay)}.`,
      })
      return res.redirect('/visit-allowances')
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('weekStartDay')
        .isIn(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])
        .withMessage('Select a valid day of the week'),
      body('remandVisitLimitPerWeek')
        .toInt()
        .isInt({ min: 1 })
        .withMessage('Unconvicted prisoners must be allowed at least 1 visit every 7 days'),
    ]
  }
}
