import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { VisitService } from '../../services'

export default class BlockNewDateController {
  public constructor(private readonly visitService: VisitService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { visitBlockDate } = req.session
      if (!visitBlockDate) {
        return res.redirect('/block-visit-dates')
      }

      const { prisonId } = req.session.selectedEstablishment
      const visitCount = await this.visitService.getBookedVisitCountByDate({
        username: res.locals.user.username,
        prisonId,
        date: visitBlockDate,
      })

      return res.render('pages/blockVisitDates/blockNewDate', {
        errors: req.flash('errors'),
        visitBlockDate,
        visitCount,
        showEstablishmentSwitcher: true,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/block-visit-dates/block-new-date')
      }

      const { confirmBlockDate } = matchedData<{ confirmBlockDate: 'yes' | 'no' }>(req)

      if (confirmBlockDate === 'yes') {
        // TODO actually block date
      }

      return res.redirect('/block-visit-dates')
    }
  }

  public validate(): ValidationChain[] {
    return [body('confirmBlockDate', 'No answer selected').isIn(['yes', 'no'])]
  }
}
