import { RequestHandler } from 'express'
import { ValidationChain } from 'express-validator'
import { AuditService, BookerService } from '../../../services'

export default class CheckLinkedVisitorsController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { requestReference } = req.params
      const { visitorRequest } = req.session

      if (!visitorRequest || visitorRequest.reference !== requestReference) {
        delete req.session.visitorRequest
        return res.redirect('/manage-bookers')
      }

      const linkedVisitors = await this.bookerService.getLinkedVisitors({
        username: res.locals.user.username,
        bookerReference: visitorRequest.bookerReference,
        prisonerId: visitorRequest.prisonerId,
      })

      return res.render('pages/bookerManagement/visitorRequests/checkLinkedVisitors', {
        errors: req.flash('errors'),
        visitorRequest,
        linkedVisitors,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      // TODO send rejection
      // TODO set flash message
      // TODO send HMPPS Audit
      // TODO clear session
      return res.send('TODO - reject request')
    }
  }

  public validate(): ValidationChain[] {
    return [
      // TODO form validation
    ]
  }
}
