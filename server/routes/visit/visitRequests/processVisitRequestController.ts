import { RequestHandler } from 'express'
import { AuditService, VisitRequestsService, VisitService } from '../../../services'
import { MoJAlert } from '../../../@types/bapv'
import { VisitReferenceParams } from '../../../@types/requestParameterTypes'
import { convertToTitleCase } from '../../../utils/utils'
import {
  VisitBookingDetails,
  VisitRequestRejectionReason,
  VisitRequestResponse,
} from '../../../data/orchestrationApiTypes'
import { isValidPrisonerNumber } from '../../validationChecks'
import { extractVisitNavState, type VisitNavState } from '../visitNavigationUtils'
import { visitRequestRejectionReasons } from '../../../constants/visitRequestRejection'

type RequestAction = 'approve' | 'reject'
type RejectVisitRequestBody = {
  rejectionReason?: unknown
}

function getVisitRequestRejectionReason(rejectionReason: unknown): VisitRequestRejectionReason {
  if (typeof rejectionReason === 'string' && rejectionReason in visitRequestRejectionReasons) {
    return rejectionReason as VisitRequestRejectionReason
  }

  return null
}

export default class ProcessVisitRequestController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly visitRequestsService: VisitRequestsService,
    private readonly visitService: VisitService,
  ) {}

  public processRequest(action: RequestAction): RequestHandler<VisitReferenceParams, unknown, RejectVisitRequestBody> {
    return async (req, res, next) => {
      const { reference } = req.params
      const { username } = res.locals.user

      const navState = extractVisitNavState({ from: req.query.from, query: req.query.query })
      const redirectPath = this.getRedirectPath(navState, req.query?.prisonerId)

      try {
        let visitRequestResponse
        if (action === 'approve') {
          visitRequestResponse = await this.visitRequestsService.approveVisitRequest({ username, reference })

          await this.auditService.approvedVisitRequest({
            visitReference: reference,
            operationId: res.locals.appInsightsOperationId,
            username,
          })
        } else {
          const visitRequestRejectionReason = getVisitRequestRejectionReason(req.body?.rejectionReason)

          visitRequestResponse = await this.visitRequestsService.rejectVisitRequest({
            username,
            reference,
            visitRequestRejectionReason,
          })

          await this.auditService.rejectedVisitRequest({
            visitReference: reference,
            rejectionReason: visitRequestRejectionReason,
            operationId: res.locals.appInsightsOperationId,
            username,
          })
        }

        req.flash('messages', this.getSuccessMessage(action, visitRequestResponse))

        return res.redirect(redirectPath)
      } catch (error) {
        // HTTP 400 Bad Request means a visit not in REQUESTED state (i.e. already approved or rejected)
        if (error.status === 400) {
          const visitDetails = await this.visitService.getVisitDetailed({ username, reference })
          req.flash('messages', this.getFailureMessage(visitDetails))

          return res.redirect(redirectPath)
        }

        return next(error)
      }
    }
  }

  private getRedirectPath(navState: VisitNavState, prisonerIdParam: unknown): string {
    if (navState.fromPage === 'visits') {
      return navState.fromPageQuery ? `/visits?${navState.fromPageQuery}` : '/visits'
    }

    if (navState.fromPage === 'prisoner') {
      const prisonerId = typeof prisonerIdParam === 'string' ? prisonerIdParam : undefined
      if (prisonerId && isValidPrisonerNumber(prisonerId)) {
        return `/prisoner/${prisonerId}`
      }
    }

    return '/requested-visits'
  }

  private getSuccessMessage(action: RequestAction, visitRequestResponse: VisitRequestResponse): MoJAlert {
    const prisonerName = convertToTitleCase(
      `${visitRequestResponse.prisonerFirstName} ${visitRequestResponse.prisonerLastName}`,
    )

    return {
      variant: 'success',
      title:
        action === 'approve'
          ? `You approved the request and booked the visit with ${prisonerName}`
          : `You rejected the request to visit ${prisonerName}`,
      showTitleAsHeading: true,
      html:
        'The main contact has been notified. ' +
        `You can <a href="/visit/${visitRequestResponse.visitReference}">view this visit again</a>.`,
    }
  }

  private getFailureMessage(visitDetails: VisitBookingDetails): MoJAlert {
    const prisonerName = convertToTitleCase(`${visitDetails.prisoner.firstName} ${visitDetails.prisoner.lastName}`)

    const message: MoJAlert = {
      variant: 'information',
      title: `The visit to ${prisonerName} has already been`,
      showTitleAsHeading: true,
      html:
        'The main contact has been notified. ' +
        `You can <a href="/visit/${visitDetails.reference}">view this visit again</a>.`,
    }

    const { visitSubStatus } = visitDetails
    if (visitSubStatus === 'APPROVED' || visitSubStatus === 'AUTO_APPROVED') {
      message.title = `${message.title} approved`
      return message
    }

    if (visitSubStatus === 'REJECTED' || visitSubStatus === 'AUTO_REJECTED') {
      message.title = `${message.title} rejected`
      return message
    }

    // TODO may be more cases to handle here when request withdrawal, etc implemented
    return null
  }
}
