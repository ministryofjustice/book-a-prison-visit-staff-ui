import { RequestHandler } from 'express'
import { body, matchedData, Meta, ValidationChain, validationResult } from 'express-validator'
import { AuditService, BookerService } from '../../../services'
import { requestAlreadyReviewedMessage, requestApprovedMessage, requestRejectedMessage } from './visitorRequestMessages'
import { VisitorRequestParams } from '../../../@types/requestParameterTypes'

export default class VisitorRequestDetailsController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler<VisitorRequestParams> {
    return async (req, res) => {
      const { requestReference } = req.params
      const { username } = res.locals.user

      const visitorRequest = await this.bookerService.getVisitorRequestForReview({ username, requestReference })

      if (visitorRequest.status !== 'REQUESTED') {
        req.flash('messages', requestAlreadyReviewedMessage())
        return res.redirect('/manage-bookers')
      }

      const linkedVisitors = await this.bookerService.getLinkedVisitors({
        username: res.locals.user.username,
        bookerReference: visitorRequest.bookerReference,
        prisonerId: visitorRequest.prisonerId,
      })

      const showNoDobWarning = visitorRequest.socialContacts.some(contact => contact.dateOfBirth === null)
      const atLeastOneSelectableContact = visitorRequest.socialContacts.some(contact => contact.dateOfBirth?.length)

      req.session.visitorRequestJourney = { visitorRequest, linkedVisitors }

      return res.render('pages/bookerManagement/visitorRequests/visitorRequestDetails', {
        errors: req.flash('errors'),
        atLeastOneSelectableContact,
        showNoDobWarning,
        visitorRequest,
        hasLinkedVisitors: !!linkedVisitors.length,
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
        return res.redirect(`/manage-bookers/visitor-request/${requestReference}/link-visitor`)
      }

      const { visitorId } = matchedData<{ visitorId: 'none' | 'reject' | number }>(req)

      // 'None' radio selected - go to linked visitors page
      if (visitorId === 'none') {
        return res.redirect(`/manage-bookers/visitor-request/${requestReference}/check-linked-visitors`)
      }

      try {
        const { username } = res.locals.user

        // 'None - reject' radio selected - reject visitor request
        if (visitorId === 'reject') {
          const rejectionReason = 'REJECT'

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
        } else {
          // A non-linked visitor selected - approve visitor request
          const approvedVisitorRequest = await this.bookerService.approveVisitorRequest({
            username,
            requestReference,
            visitorId,
          })

          req.flash('messages', requestApprovedMessage(approvedVisitorRequest))

          this.auditService.approvedVisitorRequest({
            requestReference,
            visitorId: visitorId.toString(),
            username,
            operationId: res.locals.appInsightsOperationId,
          })
        }
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
    return [
      // visitorId should be 'none' or an integer that matches a valid visitor ID
      body('visitorId')
        .if(body('visitorId').not().isIn(['none', 'reject']))
        .toInt()
        .custom((visitorId: number, { req }: Meta & { req: Express.Request }) => {
          const { visitorRequestJourney } = req.session
          return visitorRequestJourney?.visitorRequest.socialContacts.some(contact => contact.visitorId === visitorId)
        })
        .withMessage('Select a visitor to link'),
    ]
  }
}
