import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import logger from '../../logger'
import config from '../config'

export default class auditService {
  private sqsClient: SQSClient

  constructor(
    private readonly accessKeyId = config.apis.audit.accessKeyId,
    private readonly secretAccessKey = config.apis.audit.secretAccessKey,
    private readonly region = config.apis.audit.region,
    private readonly queueUrl = config.apis.audit.queueUrl,
    private readonly username: string
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

  async prisonerSearch(searchTerms: string, prisonId: string) {
    return this.sendAuditMessage({
      action: 'SEARCHED_PRISONERS',
      details: {
        searchTerms,
        prisonId,
      },
    })
  }

  async sendAuditMessage({
    action,
    timestamp = new Date(),
    details,
  }: {
    action: string
    timestamp?: Date
    details: object
  }) {
    try {
      await this.sqsClient.send(
        new SendMessageCommand({
          MessageBody: JSON.stringify({ action, timestamp, details }),
          QueueUrl: this.queueUrl,
        })
      )
    } catch (error) {
      logger.error('Problem sending message to SQS queue')
    }
  }
}
