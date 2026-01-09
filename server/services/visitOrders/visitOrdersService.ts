import { GOVUKTableRow } from '../../@types/bapv'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../../data'
import { VisitOrderHistoryDetailsDto } from '../../data/orchestrationApiTypes'
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

  async getVoHistory({ username, prisonerId }: { username: string; prisonerId: string }): Promise<VoHistoryPage> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const voHistoryDetails = await orchestrationApiClient.getVoHistory(prisonerId)
    const { visitOrderHistory, ...prisonerDetails } = voHistoryDetails

    const voHistoryRows = visitOrderHistory.map((historyItem): GOVUKTableRow => {
      return [
        // date
        { text: historyItem.createdTimeStamp.split('T')[0] },
        // reason
        { html: voHistoryReasonBuilder({ visitOrderHistory: historyItem }) },
        // VO change
        { text: historyItem.voBalanceChange.toString() },
        // VO balance
        { text: historyItem.voBalance.toString() },
        // PVO change
        { text: historyItem.pvoBalanceChange.toString() },
        // PVO balance
        { text: historyItem.pvoBalance.toString() },
      ]
    })

    return {
      ...prisonerDetails,
      voHistoryRows,
    }
  }
}
