import proxyquire from 'proxyquire'
import type { SQSClient } from '@aws-sdk/client-sqs'
import type AuditService from './auditService'

describe.skip('Audit service', () => {
  let auditService: AuditService
  let sqsClientInstance: Partial<SQSClient>

  describe('getVisitors', () => {
    beforeEach(() => {
      sqsClientInstance = {
        send: jest.fn(),
      }
      const SQSClientMock = jest.fn().mockReturnValue(sqsClientInstance)
      const SendMessageCommand = jest.fn()
      const AuditServiceClass = proxyquire('./auditService.ts', {
        '@aws-sdk/client-sqs': {
          SQSClient: SQSClientMock,
          SendMessageCommand,
        },
      }).default

      auditService = new AuditServiceClass()
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('Retrieves and processes prisoner and approved visitor details', async () => {
      const results = await auditService.prisonerSearch('sdsd', 'HEI', 'username')

      expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    })
  })
})
