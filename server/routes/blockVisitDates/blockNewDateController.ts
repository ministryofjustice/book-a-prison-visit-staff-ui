import { RequestHandler } from 'express'

export default class BlockNewDateController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { visitBlockDate } = req.session
      if (!visitBlockDate) {
        return res.redirect('/block-visit-dates')
      }

      const visitCount = 2

      return res.render('pages/blockVisitDates/blockNewDate', { visitBlockDate, visitCount })
    }
  }
}
