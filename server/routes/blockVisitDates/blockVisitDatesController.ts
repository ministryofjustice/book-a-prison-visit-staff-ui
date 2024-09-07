import { RequestHandler } from 'express'
import { BlockedDatesService } from '../../services'

export default class BlockVisitDatesController {
  public constructor(private readonly blockedDatesService: BlockedDatesService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const blockedDates = await this.blockedDatesService.getFutureBlockedDates(
        req.session.selectedEstablishment.prisonId,
        res.locals.user.username,
      )

      res.render('pages/blockVisitDates/blockVisitDates', {
        blockedDates,
        showEstablishmentSwitcher: true,
      })
    }
  }
}
