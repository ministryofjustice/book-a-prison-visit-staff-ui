import { RequestHandler } from 'express'
import { AuditService, BookerService } from '../../services'

export default class BookerDetailsController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { reference } = req.params
      const { username } = res.locals.user

      const booker = await this.bookerService.getBookerDetails({ username, reference })

      res.render('pages/bookerManagement/bookerDetails', { booker })
    }
  }
}
