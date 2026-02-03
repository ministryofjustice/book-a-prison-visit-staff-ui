import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import logger from '../../logger'
import config from '../config'
import { PrisonerBalanceAdjustmentReason, RejectVisitorRequestDto, Visit } from '../data/orchestrationApiTypes'

export default class AuditService {
  private sqsClient: SQSClient

  constructor(private readonly queueUrl = config.apis.audit.queueUrl) {
    this.sqsClient = new SQSClient({ region: config.awsRegion })
  }

  async prisonerSearch({
    searchTerms,
    prisonId,
    username,
    operationId,
  }: {
    searchTerms: string
    prisonId: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'SEARCHED_PRISONERS',
      who: username,
      operationId,
      details: {
        searchTerms,
        prisonId,
      },
    })
  }

  async viewPrisoner({
    prisonerId,
    prisonId,
    username,
    operationId,
  }: {
    prisonerId: string
    prisonId: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'VIEWED_PRISONER',
      who: username,
      operationId,
      details: {
        prisonerId,
        prisonId,
      },
    })
  }

  async reservedVisit({
    applicationReference,
    visitReference,
    prisonerId,
    prisonId,
    visitorIds,
    startTimestamp,
    endTimestamp,
    visitRestriction,
    username,
    operationId,
  }: {
    applicationReference: string
    visitReference: string
    prisonerId: string
    prisonId: string
    visitorIds: string[]
    startTimestamp: string
    endTimestamp: string
    visitRestriction: Visit['visitRestriction']
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'RESERVED_VISIT',
      who: username,
      operationId,
      details: {
        applicationReference,
        visitReference,
        prisonerId,
        prisonId,
        visitorIds,
        startTimestamp,
        endTimestamp,
        visitRestriction,
      },
    })
  }

  async bookedVisit({
    applicationReference,
    visitReference,
    prisonerId,
    prisonId,
    visitorIds,
    startTimestamp,
    endTimestamp,
    visitRestriction,
    username,
    operationId,
  }: {
    applicationReference: string
    visitReference: string
    prisonerId: string
    prisonId: string
    visitorIds: string[]
    startTimestamp: string
    endTimestamp: string
    visitRestriction: Visit['visitRestriction']
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'BOOKED_VISIT',
      who: username,
      operationId,
      details: {
        applicationReference,
        visitReference,
        prisonerId,
        prisonId,
        visitorIds,
        startTimestamp,
        endTimestamp,
        visitRestriction,
      },
    })
  }

  async dismissedNotifications({
    visitReference,
    prisonerId,
    prisonId,
    reason,
    username,
    operationId,
  }: {
    visitReference: string
    prisonerId: string
    prisonId: string
    reason: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'DISMISSED_NOTIFICATIONS',
      who: username,
      operationId,
      details: {
        visitReference,
        prisonerId,
        prisonId,
        reason,
      },
    })
  }

  async cancelledVisit({
    visitReference,
    prisonerId,
    prisonId,
    reason,
    username,
    operationId,
  }: {
    visitReference: string
    prisonerId: string
    prisonId: string
    reason: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'CANCELLED_VISIT',
      who: username,
      operationId,
      details: {
        visitReference,
        prisonerId,
        prisonId,
        reason,
      },
    })
  }

  async viewedVisits({
    viewDate,
    prisonId,
    username,
    operationId,
  }: {
    viewDate: string
    prisonId: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'VIEWED_VISITS',
      who: username,
      operationId,
      details: {
        viewDate,
        prisonId,
      },
    })
  }

  async printedVisitList({
    viewDate,
    prisonId,
    username,
    operationId,
  }: {
    viewDate: string
    prisonId: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'PRINTED_VISIT_LIST',
      who: username,
      operationId,
      details: {
        viewDate,
        prisonId,
      },
    })
  }

  async overrodeZeroVO({
    prisonerId,
    username,
    operationId,
  }: {
    prisonerId: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'OVERRODE_ZERO_VO',
      who: username,
      operationId,
      details: {
        prisonerId,
      },
    })
  }

  async visitRestrictionSelected({
    prisonerId,
    visitRestriction,
    visitorIds,
    username,
    operationId,
  }: {
    prisonerId: string
    visitRestriction: Visit['visitRestriction']
    visitorIds: string[]
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'VISIT_RESTRICTION_SELECTED',
      who: username,
      operationId,
      details: {
        prisonerId,
        visitRestriction,
        visitorIds,
      },
    })
  }

  async visitSearch({
    searchTerms,
    username,
    operationId,
  }: {
    searchTerms: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'SEARCHED_VISITS',
      who: username,
      operationId,
      details: {
        searchTerms,
      },
    })
  }

  async viewedVisitDetails({
    visitReference,
    prisonerId,
    prisonId,
    username,
    operationId,
  }: {
    visitReference: string
    prisonerId: string
    prisonId: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'VIEWED_VISIT_DETAILS',
      who: username,
      operationId,
      details: {
        visitReference,
        prisonerId,
        prisonId,
      },
    })
  }

  async blockedVisitDate({
    prisonId,
    date,
    username,
    operationId,
  }: {
    prisonId: string
    date: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'BLOCKED_VISIT_DATE',
      who: username,
      operationId,
      details: {
        prisonId,
        date,
      },
    })
  }

  async unblockedVisitDate({
    prisonId,
    date,
    username,
    operationId,
  }: {
    prisonId: string
    date: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'UNBLOCKED_VISIT_DATE',
      who: username,
      operationId,
      details: {
        prisonId,
        date,
      },
    })
  }

  async bookerSearch({ search, username, operationId }: { search: string; username: string; operationId: string }) {
    return this.sendAuditMessage({
      action: 'SEARCHED_BOOKERS',
      who: username,
      operationId,
      details: { search },
    })
  }

  async viewBooker({
    reference,
    prisonerIds,
    username,
    operationId,
  }: {
    reference: string
    prisonerIds: string[]
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'VIEWED_BOOKER',
      who: username,
      operationId,
      details: { reference, prisonerIds },
    })
  }

  async linkedBookerVisitor({
    reference,
    prisonerId,
    visitorId,
    username,
    operationId,
  }: {
    reference: string
    prisonerId: string
    visitorId: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'LINKED_BOOKER_VISITOR',
      who: username,
      operationId,
      details: { reference, prisonerId, visitorId },
    })
  }

  async unlinkedBookerVisitor({
    reference,
    prisonerId,
    visitorId,
    username,
    operationId,
  }: {
    reference: string
    prisonerId: string
    visitorId: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'UNLINKED_BOOKER_VISITOR',
      who: username,
      operationId,
      details: { reference, prisonerId, visitorId },
    })
  }

  async approvedVisitorRequest({
    requestReference,
    visitorId,
    username,
    operationId,
  }: {
    requestReference: string
    visitorId: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'APPROVED_VISITOR_REQUEST',
      who: username,
      operationId,
      details: { requestReference, visitorId },
    })
  }

  async rejectedVisitorRequest({
    requestReference,
    rejectionReason,
    username,
    operationId,
  }: {
    requestReference: string
    rejectionReason: RejectVisitorRequestDto['rejectionReason']
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'REJECTED_VISITOR_REQUEST',
      who: username,
      operationId,
      details: { requestReference, rejectionReason },
    })
  }

  async adjustedVisitBalance({
    prisonerId,
    voChange,
    pvoChange,
    reason,
    reasonDetails,
    username,
    operationId,
  }: {
    prisonerId: string
    voChange: number
    pvoChange: number
    reason: PrisonerBalanceAdjustmentReason
    reasonDetails: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'ADJUSTED_VISIT_BALANCE',
      who: username,
      operationId,
      details: { prisonerId, voChange, pvoChange, reason, reasonDetails },
    })
  }

  private async sendAuditMessage({
    action,
    who,
    timestamp = new Date(),
    operationId,
    details,
  }: {
    action: string
    who: string
    timestamp?: Date
    operationId: string
    details: object
  }) {
    const message = JSON.stringify({
      what: action,
      when: timestamp,
      operationId,
      who,
      service: config.apis.audit.serviceName,
      details: JSON.stringify(details, this.replaceUndefinedWithNull),
    })

    try {
      const messageResponse = await this.sqsClient.send(
        new SendMessageCommand({
          MessageBody: message,
          QueueUrl: this.queueUrl,
        }),
      )
      logger.info(`SQS message sent (MessageId: ${messageResponse.MessageId}, message: ${message})`)
    } catch (error) {
      logger.error(`Problem sending message to SQS queue (message: ${message})`)
      logger.error(error)
    }
  }

  private replaceUndefinedWithNull(_key: string, value: unknown) {
    return typeof value === 'undefined' ? null : value
  }
}
