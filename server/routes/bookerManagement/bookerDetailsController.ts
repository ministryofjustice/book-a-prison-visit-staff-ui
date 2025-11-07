import { RequestHandler } from 'express'
import { AuditService, BookerService } from '../../services'
import { MoJAlert } from '../../@types/bapv'

export default class BookerDetailsController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { reference } = req.params
      const { username } = res.locals.user

      const booker = await this.bookerService.getBookerDetails({ username, reference })
      const { active, emailHasMultipleAccounts } = await this.bookerService.getBookerStatus({
        username,
        email: booker.email,
        reference,
      })

      const prisonerIds = booker.permittedPrisoners.map(prisoner => prisoner.prisoner.prisonerNumber)
      await this.auditService.viewBooker({
        reference,
        prisonerIds,
        username,
        operationId: res.locals.appInsightsOperationId,
      })

      const backLinkHref = req.session.matchedBookers?.length
        ? '/manage-bookers/select-account'
        : '/manage-bookers/search'

      const messages = [...req.flash('messages'), ...this.getBookerDetailsMessages(active, emailHasMultipleAccounts)]

      res.render('pages/bookerManagement/bookerDetails', { backLinkHref, messages, active, booker })
    }
  }

  private getBookerDetailsMessages(active: boolean, emailHasMultipleAccounts: boolean): MoJAlert[] {
    if (!emailHasMultipleAccounts) {
      return []
    }

    if (active) {
      return [
        {
          variant: 'information',
          title: 'The booker’s email address has been used for more than one account',
          showTitleAsHeading: true,
          text: 'This account is active and can be used to book visits.',
        },
      ]
    }

    return [
      {
        variant: 'information',
        title: 'This account is inactive',
        showTitleAsHeading: true,
        text: 'It can no longer be used to book visits.',
      },
    ]
  }
}
