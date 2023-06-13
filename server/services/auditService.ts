import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import logger from '../../logger'
import config from '../config'
import { Visit } from '../data/orchestrationApiTypes'

export default class AuditService {
  private sqsClient: SQSClient

  constructor(
    private readonly region = config.apis.audit.region,
    private readonly queueUrl = config.apis.audit.queueUrl,
  ) {
    this.sqsClient = new SQSClient({
      region: this.region,
    })
  }

  async changeEstablishment({
    previousEstablishment,
    newEstablishment,
    username,
    operationId,
  }: {
    previousEstablishment: string
    newEstablishment: string
    username: string
    operationId: string
  }) {
    return this.sendAuditMessage({
      action: 'CHANGE_ESTABLISHMENT',
      who: username,
      operationId,
      details: {
        previousEstablishment,
        newEstablishment,
      },
    })
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

  async sendAuditMessage({
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
