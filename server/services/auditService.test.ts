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
      jest.clearAllMocks()
    })

    it('sends a prisoner search audit message', async () => {
      await auditService.prisonerSearch('sdsd', 'HEI', 'username')

      expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    })

    it('sends a view prisoner audit message', async () => {
      await auditService.viewPrisoner('A1234BC', 'HEI', 'username')

      expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    })

    it('sends a visit reserved audit message', async () => {
      await auditService.reservedVisit('ref1234', 'A1234BC', 'HEI', 'username')

      expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    })

    it('sends a visit booked audit message', async () => {
      await auditService.bookedVisit('ref1234', 'A1234BC', 'HEI', ['abc123', 'bcd321'], 'username')

      expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    })

    it('sends a cancelled visit audit message', async () => {
      await auditService.cancelledVisit('ref1234', 'A1234BC', 'HEI', 'reason for cancellation', 'username')

      expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    })

    it('sends a viewd visits page audit message', async () => {
      await auditService.viewedVisits('2022-06-01T12:12:12', 'HEI', 'username')

      expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    })

    it('sends a visit list printed audit message', async () => {
      await auditService.printedVisitList('2022-06-01T12:12:12', 'HEI', 'username')

      expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    })

    it('sends a page view audit message', async () => {
      await auditService.pageView('Find a slot', 'username')

      expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    })

    it('sends a zero VO overridden audit message', async () => {
      await auditService.overrodeZeroVO('ref1234', 'A1234BC', 'reason for cancellation', 'username')

      expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    })
  })
})
