import { RequestHandler } from 'express'
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

      return res.render('pages/blockVisitDates/blockNewDate', { visitBlockDate, visitCount })
    }
  }
}
