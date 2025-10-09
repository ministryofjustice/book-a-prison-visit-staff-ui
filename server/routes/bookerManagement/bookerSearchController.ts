import { RequestHandler } from 'express'

import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { BookerService } from '../../services'

export default class BookerSearchController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const noBookerMatch = req.session.bookerManagement?.bookers.length === 0

      res.render('pages/bookerManagement/bookerSearch', {
        errors: req.flash('errors'),
        formValues: req.flash('formValues')?.[0],
        noBookerMatch,
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

      const { search } = matchedData<{ search: string }>(req, { onlyValidData: false })

      const bookers = await this.bookerService.getBookersByEmail(res.locals.user.username, search)
      req.session.bookerManagement = { bookers }

      if (bookers.length === 0) {
        return res.redirect('/manage-bookers/search')
      }

      if (bookers.length === 1) {
        req.session.bookerManagement.selectedBooker = bookers.at(0)
        return res.redirect('/manage-bookers/booker-details')
      }

      return res.redirect('/manage-bookers/select-account')
    }
  }

  public validate(): ValidationChain[] {
    return [body('search').trim().isEmail().withMessage('Enter a valid email address')]
  }
}
