import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { AuditService, BookerService } from '../../../services'

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

      const showNoDobWarning = visitorRequest.socialContacts.some(contact => contact.dateOfBirth === null)
      const atLeastOneSelectableContact = visitorRequest.socialContacts.some(contact => contact.dateOfBirth?.length)

      // store request details needed for validation in session
      req.session.visitorRequest = {
        requestReference: visitorRequest.reference,
        bookerEmail: visitorRequest.bookerEmail,
        firstName: visitorRequest.firstName,
        lastName: visitorRequest.lastName,
        dateOfBirth: visitorRequest.dateOfBirth,
        nonLinkedContactIds: visitorRequest.socialContacts.map(contact => contact.visitorId),
      }

      return res.render('pages/bookerManagement/visitorRequests/visitorRequestDetails', {
        errors: req.flash('errors'),
        atLeastOneSelectableContact,
        showNoDobWarning,
        visitorRequest,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { requestReference } = req.params
      const { visitorRequest } = req.session

      if (!visitorRequest || visitorRequest.requestReference !== requestReference) {
        delete req.session.visitorRequest
        return res.redirect('/manage-bookers')
      }

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
      const isVisitorIdValid = visitorRequest.nonLinkedContactIds.includes(visitorId)
      if (isVisitorIdValid) {
        const { username } = res.locals.user
        const approvedVisitorRequest = await this.bookerService.approveVisitorRequest({
          username,
          requestReference,
          visitorId,
        })

        req.flash('messages', {
          variant: 'success',
          title: `You approved the request and linked ${approvedVisitorRequest.firstName} ${approvedVisitorRequest.lastName}`,
          showTitleAsHeading: true,
          html:
            'The booker has been notified by email. ' +
            `You can <a href="/manage-bookers/${approvedVisitorRequest.bookerReference}/booker-details">view the booker’s account</a>.`,
          dismissible: true,
        })

        this.auditService.approvedVisitorRequest({
          requestReference,
          visitorId: visitorIdString,
          username,
          operationId: res.locals.appInsightsOperationId,
        })

        delete req.session.visitorRequest
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
