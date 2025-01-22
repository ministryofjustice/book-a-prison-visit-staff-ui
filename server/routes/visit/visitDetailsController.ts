import { RequestHandler } from 'express'

export default class VisitDetailsController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/visit/visitDetails')
    }
  }
}
