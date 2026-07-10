import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'

export default class ChooseDateOrSessionBlockController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { blockDateOrSession } = req.session

      blockDateOrSession.backLinkHref = '/block-visit-dates'
      const { backLinkHref, date } = blockDateOrSession

      return res.render('pages/blockDatesOrSessions/chooseDateOrSessionBlock', {
        backLinkHref,
        errors: req.flash('errors'),
        date,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/block-visit-dates/block-date-or-session')
      }

      const { blockDateOrSession } = req.session
      const { blockType } = matchedData<{ blockType: 'date' | 'session' }>(req)
      blockDateOrSession.backLinkHref = '/block-visit-dates/block-date-or-session'

      return res.redirect(
        blockType === 'date' ? '/block-visit-dates/block-new-date' : '/block-visit-dates/block-new-session/choose',
      )
    }
  }

  public validate(): ValidationChain[] {
    return [body('blockType', 'No answer selected').isIn(['date', 'session'])]
  }
}
