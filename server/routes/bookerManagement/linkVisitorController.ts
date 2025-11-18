import { RequestHandler } from 'express'
import { body, matchedData, param, ValidationChain, validationResult } from 'express-validator'
import { SessionData } from 'express-session'
import { AuditService, BookerService } from '../../services'
import { isValidPrisonerNumber } from '../validationChecks'
import { SocialContactsDto } from '../../data/orchestrationApiTypes'

export default class LinkVisitorController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { reference, prisonerId, visitorId } = req.params
      const { bookerLinkVisitor } = req.session

      if (!validationResult(req).isEmpty() || !bookerLinkVisitor) {
        return res.redirect(`/manage-bookers/${reference}/booker-details`)
      }

      const visitor = this.getVisitor(bookerLinkVisitor, visitorId)

      if (prisonerId !== bookerLinkVisitor.prisonerId || !visitor) {
        return res.redirect(`/manage-bookers/${reference}/prisoner/${prisonerId}/link-visitor`)
      }

      return res.render('pages/bookerManagement/linkVisitor', {
        reference,
        prisonerId,
        visitor,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { reference, prisonerId, visitorId } = req.params
      const { bookerLinkVisitor } = req.session
      const { username } = res.locals.user

      if (!validationResult(req).isEmpty() || !bookerLinkVisitor) {
        return res.redirect(`/manage-bookers/${reference}/booker-details`)
      }

      const visitor = this.getVisitor(bookerLinkVisitor, visitorId)

      if (prisonerId !== bookerLinkVisitor.prisonerId || !visitor || visitor.dateOfBirth === null) {
        return res.redirect(`/manage-bookers/${reference}/prisoner/${prisonerId}/link-visitor`)
      }

      const { notifyBooker } = matchedData<{ notifyBooker: 'yes' | 'no' }>(req)

      await this.bookerService.linkBookerVisitor({
        username,
        reference,
        prisonerId,
        visitorId: parseInt(visitorId, 10),
        sendNotificationFlag: notifyBooker === 'yes',
      })

      // TODO send audit

      req.flash('messages', {
        variant: 'success',
        title: `${visitor.firstName} ${visitor.lastName} has been linked to this booker.`,
        text: '',
        dismissible: true,
      })

      return res.redirect(`/manage-bookers/${reference}/booker-details`)
    }
  }

  public validateView(): ValidationChain[] {
    return [param('prisonerId').custom(prisonerId => isValidPrisonerNumber(prisonerId)), param('visitorId').isInt()]
  }

  public validateSubmit(): ValidationChain[] {
    return [...this.validateView(), body('notifyBooker').isIn(['yes', 'no'])]
  }

  private getVisitor(bookerLinkVisitor: SessionData['bookerLinkVisitor'], visitorId: string): SocialContactsDto {
    return bookerLinkVisitor.nonLinkedContacts.find(contact => contact.visitorId.toString() === visitorId)
  }
}
