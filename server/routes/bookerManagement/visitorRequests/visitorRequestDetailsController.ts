import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { AuditService, BookerService } from '../../../services'
import { requestAlreadyReviewedMessage, requestApprovedMessage } from './visitorRequestMessages'

export default class VisitorRequestDetailsController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler {
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

  public submit(): RequestHandler {
    return async (req, res, next) => {
      const { requestReference } = req.params
      const { visitorRequestJourney } = req.session

      if (!visitorRequestJourney || visitorRequestJourney.visitorRequest.reference !== requestReference) {
        delete req.session.visitorRequestJourney
        return res.redirect('/manage-bookers')
      }
      const { visitorRequest } = visitorRequestJourney

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect(`/manage-bookers/visitor-request/${requestReference}/link-visitor`)
      }

      const { visitorId: visitorIdString } = matchedData<{ visitorId: string }>(req)

      if (visitorIdString === 'none') {
        return res.redirect(`/manage-bookers/visitor-request/${requestReference}/check-linked-visitors`)
      }

      const visitorId = parseInt(visitorIdString, 10)
      const validVisitorIds = visitorRequest.socialContacts.map(contact => contact.visitorId)
      const isVisitorIdValid = validVisitorIds.includes(visitorId)
      if (isVisitorIdValid) {
        const { username } = res.locals.user

        try {
          const approvedVisitorRequest = await this.bookerService.approveVisitorRequest({
            username,
            requestReference,
            visitorId,
          })

          req.flash('messages', requestApprovedMessage(approvedVisitorRequest))
        } catch (error) {
          if (error.status !== 400) {
            return next(error)
          }

          req.flash('messages', requestAlreadyReviewedMessage())
        }

        this.auditService.approvedVisitorRequest({
          requestReference,
          visitorId: visitorIdString,
          username,
          operationId: res.locals.appInsightsOperationId,
        })

        delete req.session.visitorRequestJourney
      }

      return res.redirect(`/manage-bookers`)
    }
  }

  public validate(): ValidationChain[] {
    return [
      // visitorId should be an integer or 'none'
      body('visitorId').if(body('visitorId').not().equals('none')).isInt().withMessage('Select a visitor to link'),
    ]
  }
}
