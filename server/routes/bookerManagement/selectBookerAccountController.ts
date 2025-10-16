import { RequestHandler } from 'express'

import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { AuditService, BookerService } from '../../services'

export default class SelectBookerAccountController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { matchedBookers } = req.session

      if (matchedBookers.length <= 1) {
        return res.redirect('/booker-management/search')
      }

      return res.render('pages/bookerManagement/selectAccount.njk', {
        errors: req.flash('errors'),
        matchedBookers,
      })
    }
  }

  public selectAccount(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/manage-bookers/select-account')
      }

      const { reference } = matchedData<{ reference: string }>(req)
      return res.redirect(`/manage-bookers/booker-details/${reference}`)
    }
  }

  public validate(): ValidationChain[] {
    return [body('reference').trim().notEmpty().withMessage('Select an account to view')]
  }
}
