import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { AuditService, BookerService } from '../../../services'
import { PrisonVisitorRequestDto, RejectVisitorRequestDto } from '../../../data/orchestrationApiTypes'

export default class CheckLinkedVisitorsController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  private readonly REJECTION_REASONS: RejectVisitorRequestDto['rejectionReason'][] = ['ALREADY_LINKED', 'REJECT']

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
      const { requestReference } = req.params
      const { visitorRequest } = req.session

      if (!visitorRequest || visitorRequest.reference !== requestReference) {
        delete req.session.visitorRequest
        return res.redirect('/manage-bookers')
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect(`/manage-bookers/visitor-request/${requestReference}/check-linked-visitors`)
      }

      const { rejectionReason } = matchedData<{ rejectionReason: RejectVisitorRequestDto['rejectionReason'] }>(req)
      const { username } = res.locals.user

      const rejectedVisitorRequest = await this.bookerService.rejectVisitorRequest({
        username,
        requestReference,
        rejectionReason,
      })

      req.flash('messages', {
        variant: 'success',
        title: this.getAlertMessageTitle(rejectedVisitorRequest, rejectionReason),
        showTitleAsHeading: true,
        html:
          'The booker has been notified by email. ' +
          `You can <a href="/manage-bookers/${rejectedVisitorRequest.bookerReference}/booker-details">view the booker’s account</a>.`,
        dismissible: true,
      })

      this.auditService.rejectedVisitorRequest({
        requestReference,
        rejectionReason,
        username,
        operationId: res.locals.appInsightsOperationId,
      })

      delete req.session.visitorRequest

      return res.redirect(`/manage-bookers`)
    }
  }

  public validate(): ValidationChain[] {
    return [body('rejectionReason').isIn(this.REJECTION_REASONS).withMessage('Select an answer')]
  }

  private getAlertMessageTitle(
    rejectedVisitorRequest: PrisonVisitorRequestDto,
    rejectionReason: RejectVisitorRequestDto['rejectionReason'],
  ): string {
    if (rejectionReason === 'ALREADY_LINKED') {
      return `You confirmed that ${rejectedVisitorRequest.firstName} ${rejectedVisitorRequest.lastName} is already a linked visitor`
    }

    return `You rejected the request to link ${rejectedVisitorRequest.firstName} ${rejectedVisitorRequest.lastName}`
  }
}
