import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import logger from '../../logger'
import config from '../config'

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

  async prisonerSearch(searchTerms: string, prisonId: string, username: string) {
    return this.sendAuditMessage({
      action: 'SEARCHED_PRISONERS',
      who: username,
      details: {
        searchTerms,
        prisonId,
      },
    })
  }

  async viewPrisoner(prisonerId: string, prisonId: string, username: string) {
    return this.sendAuditMessage({
      action: 'VIEWED_PRISONER',
      who: username,
      details: {
        prisonerId,
        prisonId,
      },
    })
  }

  async reservedVisit(reference: string, prisonerId: string, prisonId: string, username: string) {
    return this.sendAuditMessage({
      action: 'RESERVED_VISIT',
      who: username,
      details: {
        reference,
        prisonerId,
        prisonId,
      },
    })
  }

  async bookedVisit(reference: string, prisonerId: string, prisonId: string, visitorIds: string[], username: string) {
    return this.sendAuditMessage({
      action: 'BOOKED_VISIT',
      who: username,
      details: {
        reference,
        prisonerId,
        prisonId,
        visitorIds,
      },
    })
  }

  async cancelledVisit(reference: string, prisonerId: string, prisonId: string, reason: string, username: string) {
    return this.sendAuditMessage({
      action: 'CANCELLED_VISIT',
      who: username,
      details: {
        reference,
        prisonerId,
        prisonId,
        reason,
      },
    })
  }

  async viewedVisits(viewDate: string, prisonId: string, username: string) {
    return this.sendAuditMessage({
      action: 'VIEWED_VISITS',
      who: username,
      details: {
        viewDate,
        prisonId,
      },
    })
  }

  async printedVisitList(viewDate: string, prisonId: string, username: string) {
    return this.sendAuditMessage({
      action: 'PRINTED_VISIT_LIST',
      who: username,
      details: {
        viewDate,
        prisonId,
      },
    })
  }

  async pageView(pageName: string, username: string) {
    return this.sendAuditMessage({
      action: 'PAGE_VIEW',
      who: username,
      details: {
        pageName,
      },
    })
  }

  async overrodeZeroVO(reference: string, prisonerId: string, reason: string, username: string) {
    return this.sendAuditMessage({
      action: 'OVERRODE_ZERO_VO',
      who: username,
      details: {
        reference,
        prisonerId,
        reason,
      },
    })
  }

  async sendAuditMessage({
    action,
    who,
    timestamp = new Date(),
    details,
  }: {
    action: string
    who: string
    timestamp?: Date
    details: object
  }) {
    try {
      const message = JSON.stringify({
        what: action,
        who,
        service: config.apis.audit.serviceName,
        when: timestamp,
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
