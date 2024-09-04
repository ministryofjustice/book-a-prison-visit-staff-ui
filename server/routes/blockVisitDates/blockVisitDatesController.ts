import { RequestHandler } from 'express'

export default class BlockVisitDatesController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      res.render('pages/blockVisitDates/blockVisitDates')
    }
  }
}
