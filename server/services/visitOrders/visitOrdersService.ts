import { GOVUKTableRow } from '../../@types/bapv'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../../data'
import { VisitOrderHistoryDetailsDto, VisitOrderHistoryDto } from '../../data/orchestrationApiTypes'
import voHistoryReasonBuilder from './voHistoryReasonBuilder'

export type VoHistoryPage = Pick<
  VisitOrderHistoryDetailsDto,
  'prisonerId' | 'firstName' | 'lastName' | 'convictedStatus' | 'incentiveLevel' | 'category'
> & { voHistoryRows: GOVUKTableRow[] }

export default class VisitOrdersService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  // VO history entries that will be rendered in default style; others will be secondary text style
  private readonly VO_HISTORY_TYPES_DEFAULT_STYLE: VisitOrderHistoryDto['visitOrderHistoryType'][] = [
    'ALLOCATION_REFUNDED_BY_VISIT_CANCELLED',
    'ALLOCATION_USED_BY_VISIT',
    // TODO check this list is complete (when VB-4260 done)
  ]

  async getVoHistory({
    username,
    prisonId,
    prisonerId,
  }: {
    username: string
    prisonId: string
    prisonerId: string
  }): Promise<VoHistoryPage> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const voHistoryDetails = await orchestrationApiClient.getVoHistory({ prisonId, prisonerId })
    const { visitOrderHistory, ...prisonerDetails } = voHistoryDetails

    const voHistoryRows = visitOrderHistory.map((historyItem): GOVUKTableRow => {
      const classes = this.VO_HISTORY_TYPES_DEFAULT_STYLE.includes(historyItem.visitOrderHistoryType)
        ? ''
        : 'bapv-secondary-text'

      return [
        // date
        { text: historyItem.createdTimeStamp.split('T')[0], classes },
        // reason
        { html: voHistoryReasonBuilder({ visitOrderHistory: historyItem }), classes },
        // VO change
        { text: historyItem.voBalanceChange.toString(), classes },
        // VO balance
        { text: historyItem.voBalance.toString(), classes },
        // PVO change
        { text: historyItem.pvoBalanceChange.toString(), classes },
        // PVO balance
        { text: historyItem.pvoBalance.toString(), classes },
      ]
    })

    return {
      ...prisonerDetails,
      voHistoryRows,
    }
  }
}
