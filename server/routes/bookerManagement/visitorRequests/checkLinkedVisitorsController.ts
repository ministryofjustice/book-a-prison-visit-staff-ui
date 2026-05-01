import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { AuditService, BookerService } from '../../../services'
import { RejectVisitorRequestDto } from '../../../data/orchestrationApiTypes'
import { requestAlreadyReviewedMessage, requestRejectedMessage } from './visitorRequestMessages'
import { VisitorRequestParams } from '../../../@types/requestParameterTypes'

export default class CheckLinkedVisitorsController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  private readonly REJECTION_REASONS: RejectVisitorRequestDto['rejectionReason'][] = ['ALREADY_LINKED', 'REJECT']

  public view(): RequestHandler<VisitorRequestParams> {
    return async (req, res) => {
      const { requestReference } = req.params
      const { visitorRequestJourney } = req.session

      if (!visitorRequestJourney || visitorRequestJourney.visitorRequest.reference !== requestReference) {
        delete req.session.visitorRequestJourney
        return res.redirect('/manage-bookers')
      }
      const { visitorRequest, linkedVisitors } = visitorRequestJourney

      return res.render('pages/bookerManagement/visitorRequests/checkLinkedVisitors', {
        errors: req.flash('errors'),
        visitorRequest,
        linkedVisitors,
      })
    }
  }

  public submit(): RequestHandler<VisitorRequestParams> {
    return async (req, res, next) => {
      const { requestReference } = req.params
      const { visitorRequestJourney } = req.session

      if (!visitorRequestJourney || visitorRequestJourney.visitorRequest.reference !== requestReference) {
        delete req.session.visitorRequestJourney
        return res.redirect('/manage-bookers')
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect(`/manage-bookers/visitor-request/${requestReference}/check-linked-visitors`)
      }

      const { rejectionReason } = matchedData<{ rejectionReason: RejectVisitorRequestDto['rejectionReason'] }>(req)
      const { username } = res.locals.user

      try {
        const rejectedVisitorRequest = await this.bookerService.rejectVisitorRequest({
          username,
          requestReference,
          rejectionReason,
        })

        req.flash('messages', requestRejectedMessage(rejectedVisitorRequest, rejectionReason))

        this.auditService.rejectedVisitorRequest({
          requestReference,
          rejectionReason,
          username,
          operationId: res.locals.appInsightsOperationId,
        })
      } catch (error) {
        if (error.status !== 400) {
          return next(error)
        }

        req.flash('messages', requestAlreadyReviewedMessage())
      }

      delete req.session.visitorRequestJourney
      return res.redirect(`/manage-bookers`)
    }
  }

  public validate(): ValidationChain[] {
    return [body('rejectionReason').isIn(this.REJECTION_REASONS).withMessage('Select an answer')]
  }
}
