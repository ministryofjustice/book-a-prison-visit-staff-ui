import { RequestHandler } from 'express'
import { AuditService, BookerService } from '../../services'

export default class BookerLinkVisitorController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { reference } = req.params

      // TODO render notify booker by email page
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { reference } = req.params

      // TODO call service to link visitor
      // TODO HMPPS Audit
      // TODO redirect to booker details with flash message
    }
  }

  // TODO validations for req.params (both routes)?
}
