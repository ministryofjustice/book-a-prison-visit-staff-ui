import { RequestHandler } from 'express'
import { VisitRequestsService, VisitService } from '../../services'
import { MoJAlert } from '../../@types/bapv'
import { VisitReferenceParams } from '../../@types/requestParameterTypes'
import { convertToTitleCase } from '../../utils/utils'
import { VisitBookingDetails, VisitRequestResponse } from '../../data/orchestrationApiTypes'
import { isValidPrisonerNumber } from '../validationChecks'
import { extractVisitNavState, type VisitNavState } from './visitNavigationUtils'
import { getErrorStatus } from '../../utils/errorHelpers'

type RequestAction = 'approve' | 'reject'

export default class ProcessVisitRequestController {
  public constructor(
    private readonly visitRequestsService: VisitRequestsService,
    private readonly visitService: VisitService,
  ) {}

  public processRequest(action: RequestAction): RequestHandler<VisitReferenceParams> {
    return async (req, res, next) => {
      const { reference } = req.params
      const { username } = res.locals.user
      const navState = extractVisitNavState({ from: req.query.from, query: req.query.query })
      const redirectPath = this.getRedirectPath(navState, req.query?.prisonerId)

      try {
        const visitRequestResponse =
          action === 'approve'
            ? await this.visitRequestsService.approveVisitRequest(username, reference)
            : await this.visitRequestsService.rejectVisitRequest(username, reference)

        req.flash('messages', this.getSuccessMessage(action, visitRequestResponse))

        return res.redirect(redirectPath)
      } catch (error) {
        // HTTP 400 Bad Request means a visit not in REQUESTED state (i.e. already approved or rejected)
        if (getErrorStatus(error) === 400) {
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
