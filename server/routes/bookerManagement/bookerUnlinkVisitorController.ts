import { RequestHandler } from 'express'
import { param, ValidationChain, validationResult } from 'express-validator'
import { AuditService, BookerService } from '../../services'
import logger from '../../../logger'
import { isValidPrisonerNumber } from '../validationChecks'

export default class BookerUnlinkVisitorController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  public unlink(): RequestHandler {
    return async (req, res) => {
      const { reference, prisonerId, visitorId: visitorIdString } = req.params
      const visitorId = parseInt(visitorIdString, 10)
      const bookerDetailsPageUrl = `/manage-bookers/${reference}/booker-details`

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.redirect(bookerDetailsPageUrl)
      }

      const { username } = res.locals.user
      try {
        const booker = await this.bookerService.getBookerDetails({ username, reference })
        const visitorToUnlink = booker.permittedPrisoners
          .find(prisoner => prisoner.prisoner.prisonerNumber === prisonerId)
          .permittedVisitors.find(visitor => visitor.visitorId === visitorId) // TODO check how this handles undefined errors

        const visitorName = `${visitorToUnlink.firstName} ${visitorToUnlink.lastName}`

        await this.bookerService.unlinkBookerVisitor({ username, reference, prisonerId, visitorId })

        req.flash('messages', {
          variant: 'success',
          title: `${visitorName} has been unlinked from this booker.`,
          text: '',
          dismissible: true,
        })

        // TODO send audit
      } catch (error) {
        logger.error(
          error,
          `Could not unlink visitor ${visitorId} for prisoner ${prisonerId} for booker ${reference} (user - ${username})`,
        )
      }

      return res.redirect(bookerDetailsPageUrl)
    }
  }

  public validate(): ValidationChain[] {
    return [param('prisonerId').custom(prisonerId => isValidPrisonerNumber(prisonerId)), param('visitorId').isInt()]
  }
}
