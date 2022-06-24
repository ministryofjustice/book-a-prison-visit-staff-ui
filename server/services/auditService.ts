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
        details,
      })
      logger.info(message)

      await this.sqsClient.send(
        new SendMessageCommand({
          MessageBody: message,
          QueueUrl: this.queueUrl,
        }),
      )
    } catch (error) {
      logger.error('Problem sending message to SQS queue')
      logger.error(error)
    }
  }
}
