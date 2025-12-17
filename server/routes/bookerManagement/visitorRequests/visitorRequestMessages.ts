import { MoJAlert } from '../../../@types/bapv'
import { PrisonVisitorRequestDto, RejectVisitorRequestDto } from '../../../data/orchestrationApiTypes'

const bookerNotifiedHtml = (bookerReference: string): string =>
  'The booker has been notified by email. ' +
  `You can <a href="/manage-bookers/${bookerReference}/booker-details">view the booker’s account</a>.`

export const requestAlreadyReviewedMessage = (): MoJAlert => ({
  variant: 'information',
  title: 'Request already reviewed',
  text: 'The selected request has already been reviewed by another staff member.',
})

export const requestApprovedMessage = (visitorRequest: PrisonVisitorRequestDto): MoJAlert => ({
  variant: 'success',
  title: `You approved the request and linked ${visitorRequest.firstName} ${visitorRequest.lastName}`,
  showTitleAsHeading: true,
  html: bookerNotifiedHtml(visitorRequest.bookerReference),
  dismissible: true,
})

export const requestRejectedMessage = (
  visitorRequest: PrisonVisitorRequestDto,
  rejectionReason: RejectVisitorRequestDto['rejectionReason'],
): MoJAlert => {
  const title =
    rejectionReason === 'ALREADY_LINKED'
      ? `You confirmed that ${visitorRequest.firstName} ${visitorRequest.lastName} is already a linked visitor`
      : `You rejected the request to link ${visitorRequest.firstName} ${visitorRequest.lastName}`

  return {
    variant: 'success',
    title,
    showTitleAsHeading: true,
    html: bookerNotifiedHtml(visitorRequest.bookerReference),
    dismissible: true,
  }
}
