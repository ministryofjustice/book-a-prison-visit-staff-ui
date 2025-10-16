import { RequestHandler } from 'express'

import { body, matchedData, Meta, ValidationChain, validationResult } from 'express-validator'
import { BookerService } from '../../services'

export default class SelectBookerAccountController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { matchedBookers } = req.session

      if (matchedBookers.length <= 1) {
        return res.redirect('/manage-bookers/search')
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
      return res.redirect(`/manage-bookers/${reference}/booker-details`)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('reference')
        .trim()
        .custom((reference: string, { req }: Meta & { req: Express.Request }) => {
          const { matchedBookers } = req.session
          return matchedBookers.some(booker => booker.reference === reference)
        })
        .withMessage('Select an account to view'),
    ]
  }
}
