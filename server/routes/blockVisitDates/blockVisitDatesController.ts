import { RequestHandler } from 'express'
import { BlockedDatesService } from '../../services'

export default class BlockVisitDatesController {
  public constructor(private readonly blockedDatesService: BlockedDatesService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const excludeDates = await this.blockedDatesService.getFutureExcludeDates(
        req.session.selectedEstablishment.prisonId,
        res.locals.user.username,
      )

      res.render('pages/blockVisitDates/blockVisitDates', {
        excludeDates,
        showEstablishmentSwitcher: true,
      })
    }
  }
}
