import { RequestHandler } from 'express'
import { BookerService } from '../../services'

export default class BookerLinkVisitorListController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { reference } = req.params

      // TODO render link visitor list page
      // TODO check for visitors with no DoB
    }
  }

  // TODO validations for req.params for prisonerId?

}
