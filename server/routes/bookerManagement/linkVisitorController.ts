import { RequestHandler } from 'express'
import { AuditService, BookerService } from '../../services'

export default class LinkVisitorController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => { return res.send('HERE')
      const { reference, prisonerId, visitorId } = req.params
      const { username } = res.locals.user

      // TODO sort out - this is prisoner; need visitor info
      // duplication *necessary?* from bookerLinkVisitorListController
      const booker = await this.bookerService.getBookerDetails({ username, reference })
      const prisoner = booker.permittedPrisoners.find(
        permittedPrisoner => permittedPrisoner.prisoner.prisonerNumber === prisonerId,
      )?.prisoner

      if (!prisoner) {
        return res.redirect(`/manage-bookers/${reference}/booker-details`)
      }

      return res.render('pages/bookerManagement/linkVisitor', {
        prisoner,
        visitorId,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { reference, prisonerId, visitorId } = req.params
      const { username } = res.locals.user
      const { notifyBooker }: { notifyBooker: string } = req.body

      const permittedVisitor = await this.bookerService.linkBookerVisitor({
        username,
        reference,
        prisonerId,
        visitorId, // needs to be converted to number
        notifyBooker,
      })

      return res.redirect(`/manage-bookers/${reference}/booker-details`)
    }
  }

  // TODO validations for req.params (both routes)?
  // need to check visitor IDs are valid and have DoB
}
