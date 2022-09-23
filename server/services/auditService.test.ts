import config from '../config'
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

const fakeDate = '2022-07-11T09:00:00.000Z'
jest.useFakeTimers().setSystemTime(new Date(fakeDate))

const QueueUrl = config.apis.audit.queueUrl

describe('Audit service', () => {
  let auditService: AuditService

  beforeEach(() => {
    auditService = new AuditService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('sends a prisoner search audit message', async () => {
    await auditService.prisonerSearch({ searchTerms: 'Smith', username: 'username', operationId: 'operation-id' })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'SEARCHED_PRISONERS',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"searchTerms":"Smith","prisonId":"HEI"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a view prisoner audit message', async () => {
    await auditService.viewPrisoner({
      prisonerId: 'A1234BC',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'VIEWED_PRISONER',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"prisonerId":"A1234BC","prisonId":"HEI"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a visit reserved audit message', async () => {
    await auditService.reservedVisit({
      visitReference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      visitorIds: ['abc123', 'bcd321'],
      startTimestamp: '2022-08-24T11:00:00',
      endTimestamp: '2022-08-24T12:00:00',
      visitRestriction: 'OPEN',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'RESERVED_VISIT',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details:
            '{"visitReference":"ab-cd-ef-gh","prisonerId":"A1234BC","prisonId":"HEI","visitorIds":["abc123","bcd321"],' +
            '"startTimestamp":"2022-08-24T11:00:00","endTimestamp":"2022-08-24T12:00:00","visitRestriction":"OPEN"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a visit booked audit message', async () => {
    await auditService.bookedVisit({
      visitReference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      visitorIds: ['abc123', 'bcd321'],
      startTimestamp: '2022-08-24T11:00:00',
      endTimestamp: '2022-08-24T12:00:00',
      visitRestriction: 'OPEN',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'BOOKED_VISIT',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details:
            '{"visitReference":"ab-cd-ef-gh","prisonerId":"A1234BC","prisonId":"HEI","visitorIds":["abc123","bcd321"],' +
            '"startTimestamp":"2022-08-24T11:00:00","endTimestamp":"2022-08-24T12:00:00","visitRestriction":"OPEN"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a cancelled visit audit message', async () => {
    await auditService.cancelledVisit({
      visitReference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      reason: 'PRISONER_CANCELLED: illness',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'CANCELLED_VISIT',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details:
            '{"visitReference":"ab-cd-ef-gh","prisonerId":"A1234BC","prisonId":"HEI","reason":"PRISONER_CANCELLED: illness"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a viewd visits page audit message', async () => {
    await auditService.viewedVisits('2022-06-01T12:12:12', 'HEI', 'username', 'operation-id')

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'VIEWED_VISITS',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"viewDate":"2022-06-01T12:12:12","prisonId":"HEI"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a visit list printed audit message', async () => {
    await auditService.printedVisitList('2022-06-01T12:12:12', 'HEI', 'username', 'operation-id')

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'PRINTED_VISIT_LIST',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"viewDate":"2022-06-01T12:12:12","prisonId":"HEI"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a zero VO overridden audit message', async () => {
    await auditService.overrodeZeroVO({ prisonerId: 'A1234BC', username: 'username', operationId: 'operation-id' })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'OVERRODE_ZERO_VO',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"prisonerId":"A1234BC"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a visit restriction (open/closed) selected audit message', async () => {
    await auditService.visitRestrictionSelected('A1234BC', 'CLOSED', ['abc123', 'bcd321'], 'username', 'operation-id')

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'VISIT_RESTRICTION_SELECTED',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"prisonerId":"A1234BC","visitRestriction":"CLOSED","visitorIds":["abc123","bcd321"]}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a visit search audit message', async () => {
    await auditService.visitSearch('ab-cd-ef-gh', 'username', 'operation-id')

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'SEARCHED_VISITS',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"searchTerms":"ab-cd-ef-gh"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a viewed visit details audit message', async () => {
    await auditService.viewedVisitDetails('ab-cd-ef-gh', 'A1234BC', 'HEI', 'username', 'operation-id')

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'VIEWED_VISIT_DETAILS',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"visitReference":"ab-cd-ef-gh","prisonerId":"A1234BC","prisonId":"HEI"}',
        }),
        QueueUrl,
      },
    })
  })
})
