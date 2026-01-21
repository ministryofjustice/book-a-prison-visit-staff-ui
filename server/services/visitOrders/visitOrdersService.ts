import { format, parseISO } from 'date-fns'
import { GOVUKTableRow } from '../../@types/bapv'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../../data'
import { PrisonerBalanceDto, VisitOrderHistoryDetailsDto, VisitOrderHistoryDto } from '../../data/orchestrationApiTypes'
import voHistoryReasonBuilder from './voHistoryReasonBuilder'

export type VisitOrderHistoryPage = Pick<
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
    'MANUAL_PRISONER_BALANCE_ADJUSTMENT',
  ]

  async getVoBalance({
    username,
    prisonId,
    prisonerId,
  }: {
    username: string
    prisonId: string
    prisonerId: string
  }): Promise<PrisonerBalanceDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVoBalance({ prisonId, prisonerId })
  }

  async getVoHistory({
    username,
    prisonId,
    prisonerId,
  }: {
    username: string
    prisonId: string
    prisonerId: string
  }): Promise<VisitOrderHistoryPage> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const voHistoryDetails = await orchestrationApiClient.getVoHistory({ prisonId, prisonerId })
    const { visitOrderHistory, ...prisonerDetails } = voHistoryDetails

    const voHistoryRows = visitOrderHistory.map((historyItem, index): GOVUKTableRow => {
      const date = format(parseISO(historyItem.createdTimeStamp), 'd/M/yyyy')
      const reason = voHistoryReasonBuilder(historyItem)

      const classes = this.VO_HISTORY_TYPES_DEFAULT_STYLE.includes(historyItem.visitOrderHistoryType)
        ? ''
        : 'bapv-secondary-text'

      return [
        // date
        { text: date, classes, attributes: { 'data-test': `date-${index}` } },
        // reason
        { html: reason, classes, attributes: { 'data-test': `reason-${index}` } },
        // VO change
        { text: historyItem.voBalanceChange.toString(), classes, attributes: { 'data-test': `vo-change-${index}` } },
        // VO balance
        { text: historyItem.voBalance.toString(), classes, attributes: { 'data-test': `vo-balance-${index}` } },
        // PVO change
        { text: historyItem.pvoBalanceChange.toString(), classes, attributes: { 'data-test': `pvo-change-${index}` } },
        // PVO balance
        { text: historyItem.pvoBalance.toString(), classes, attributes: { 'data-test': `pvo-balance-${index}` } },
      ]
    })

    return {
      ...prisonerDetails,
      voHistoryRows,
    }
  }
}
