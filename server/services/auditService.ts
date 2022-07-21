import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import logger from '../../logger'
import config from '../config'
import { Visit } from '../data/visitSchedulerApiTypes'

export default class AuditService {
  private sqsClient: SQSClient

  constructor(
    private readonly accessKeyId = config.apis.audit.accessKeyId,
    private readonly secretAccessKey = config.apis.audit.secretAccessKey,
    private readonly region = config.apis.audit.region,
    private readonly queueUrl = config.apis.audit.queueUrl,
  ) {
    this.sqsClient = new SQSClient({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
      endpoint: config.apis.audit.endpoint,
    })
  }

  async prisonerSearch(searchTerms: string, prisonId: string, username: string, operationId: string) {
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

  async viewPrisoner(prisonerId: string, prisonId: string, username: string, operationId: string) {
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

  async reservedVisit(
    visitReference: string,
    prisonerId: string,
    prisonId: string,
    username: string,
    operationId: string,
  ) {
    return this.sendAuditMessage({
      action: 'RESERVED_VISIT',
      who: username,
      operationId,
      details: {
        visitReference,
        prisonerId,
        prisonId,
      },
    })
  }

  async bookedVisit(
    visitReference: string,
    prisonerId: string,
    prisonId: string,
    visitorIds: string[],
    username: string,
    operationId: string,
  ) {
    return this.sendAuditMessage({
      action: 'BOOKED_VISIT',
      who: username,
      operationId,
      details: {
        visitReference,
        prisonerId,
        prisonId,
        visitorIds,
      },
    })
  }

  async cancelledVisit(
    visitReference: string,
    prisonerId: string,
    prisonId: string,
    reason: string,
    username: string,
    operationId: string,
  ) {
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

  async viewedVisits(viewDate: string, prisonId: string, username: string, operationId: string) {
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

  async printedVisitList(viewDate: string, prisonId: string, username: string, operationId: string) {
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

  async overrodeZeroVO(prisonerId: string, username: string, operationId: string) {
    return this.sendAuditMessage({
      action: 'OVERRODE_ZERO_VO',
      who: username,
      operationId,
      details: {
        prisonerId,
      },
    })
  }

  async visitRestrictionSelected(
    prisonerId: string,
    visitRestriction: Visit['visitRestriction'],
    visitorIds: string[],
    username: string,
    operationId: string,
  ) {
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

  async visitSearch(searchTerms: string, username: string, operationId: string) {
    return this.sendAuditMessage({
      action: 'SEARCHED_VISITS',
      who: username,
      operationId,
      details: {
        searchTerms,
      },
    })
  }

  async viewedVisitDetails(
    visitReference: string,
    prisonerId: string,
    prisonId: string,
    username: string,
    operationId: string,
  ) {
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
    try {
      const message = JSON.stringify({
        what: action,
        when: timestamp,
        operationId,
        who,
        service: config.apis.audit.serviceName,
        details: JSON.stringify(details),
      })

      const messageResponse = await this.sqsClient.send(
        new SendMessageCommand({
          MessageBody: message,
          QueueUrl: this.queueUrl,
        }),
      )

      logger.info(`SQS message sent (${messageResponse.MessageId})`)
    } catch (error) {
      logger.error('Problem sending message to SQS queue')
      logger.error(error)
    }
  }
}
