import AuditService from './auditService'

const sqsClientInstance = {
  send: jest.fn().mockReturnThis(),
}

jest.mock('@aws-sdk/client-sqs', () => {
  const { SendMessageCommand } = jest.requireActual('@aws-sdk/client-sqs')
  return {
    SQSClient: jest.fn(() => sqsClientInstance),
    SendMessageCommand,
  }
})

describe('Audit service', () => {
  let auditService: AuditService

  describe('getVisitors', () => {
    beforeEach(() => {
      auditService = new AuditService()
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('Retrieves and processes prisoner and approved visitor details', async () => {
      await auditService.prisonerSearch('sdsd', 'HEI', 'username')

      expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    })
  })
})
