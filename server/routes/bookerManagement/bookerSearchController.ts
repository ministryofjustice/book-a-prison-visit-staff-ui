import { RequestHandler } from 'express'

import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { AuditService, BookerService } from '../../services'

export default class BookerSearchController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const noBookerFound = req.query['no-booker-found'] === ''

      res.render('pages/bookerManagement/bookerSearch', {
        errors: req.flash('errors'),
        formValues: req.flash('formValues')?.[0],
        noBookerFound,
      })
    }
  }

  public search(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))
        return res.redirect('/manage-bookers/search')
      }

      const { search } = matchedData<{ search: string }>(req) // field 'search' rather than 'email' to avoid browser autofill
      const bookers = await this.bookerService.getBookersByEmail(res.locals.user.username, search)

      await this.auditService.bookerSearch({
        search,
        username: res.locals.user.username,
        operationId: res.locals.appInsightsOperationId,
      })

      // booker not found
      if (bookers.length === 0) {
        req.flash('formValues', { search })
        return res.redirect('/manage-bookers/search?no-booker-found')
      }

      // single booker record found
      if (bookers.length === 1) {
        return res.redirect(`/manage-bookers/booker-details/${bookers[0].reference}`)
      }

      // multiple booker records found
      req.session.bookerEmail = search
      return res.redirect('/manage-bookers/select-account')
    }
  }

  public validate(): ValidationChain[] {
    return [body('search').trim().isEmail().withMessage('Enter a valid email address')]
  }
}
