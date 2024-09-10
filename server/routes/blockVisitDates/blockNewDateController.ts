import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { format } from 'date-fns'
import { BlockedDatesService, VisitService } from '../../services'
import logger from '../../../logger'

export default class BlockNewDateController {
  public constructor(
    private readonly visitService: VisitService,
    private readonly blockedDatesService: BlockedDatesService,
  ) {}

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
      const { visitBlockDate } = req.session
      if (!visitBlockDate) {
        return res.redirect('/block-visit-dates')
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/block-visit-dates/block-new-date')
      }

      const { confirmBlockDate } = matchedData<{ confirmBlockDate: 'yes' | 'no' }>(req)

      if (confirmBlockDate === 'yes') {
        const { prisonId } = req.session.selectedEstablishment
        try {
          await this.blockedDatesService.blockVisitDate(res.locals.user.username, prisonId, visitBlockDate)
          req.flash('message', `Visits are blocked for ${format(visitBlockDate, 'EEEE d MMMM yyyy')}.`)
        } catch (error) {
          logger.error(error, `Could not block visit date ${visitBlockDate} for ${res.locals.user.username}`)
        }
      }

      delete req.session.visitBlockDate
      return res.redirect('/block-visit-dates')
    }
  }

  public validate(): ValidationChain[] {
    return [body('confirmBlockDate', 'No answer selected').isIn(['yes', 'no'])]
  }
}
