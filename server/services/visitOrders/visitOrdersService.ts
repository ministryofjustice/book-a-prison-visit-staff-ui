import { VoHistoryPage } from '../../@types/bapv'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../../data'
import voHistoryReasonBuilder from './voHistoryReasonBuilder'

export default class VisitOrdersService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getVoHistory({ username, prisonerId }: { username: string; prisonerId: string }): Promise<VoHistoryPage> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const results = await orchestrationApiClient.getVoHistory(prisonerId)

    const prisonerDetails = {
      prisonerName: `${results.firstName} ${results.lastName}`, // TODO need to use prisoner name helper function
      category: results.category,
      convictedStatus: results.convictedStatus,
      incentiveLevel: results.incentiveLevel,
    }

    const historyItems = results.visitOrderHistory.map(history => {
      return {
        date: history.createdTimeStamp.split('T')[0],
        visitOrderHistoryType: history.visitOrderHistoryType,
        voBalanceChange: history.voBalanceChange,
        voBalance: history.voBalance,
        pvoBalanceChange: history.pvoBalanceChange,
        pvoBalance: history.pvoBalance,
        reason: voHistoryReasonBuilder({ visitOrderHistory: history }),
      }
    })

    // TODO - missing style (greying)

    return {
      prisonerDetails,
      historyItems,
    }
  }
}
