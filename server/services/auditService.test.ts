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

const prisonId = 'HEI'
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
    await auditService.prisonerSearch({
      searchTerms: 'Smith',
      prisonId,
      username: 'username',
      operationId: 'operation-id',
    })

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
      prisonId,
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
      applicationReference: 'aaa-bbb-ccc',
      visitReference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId,
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
            '{"applicationReference":"aaa-bbb-ccc","visitReference":"ab-cd-ef-gh","prisonerId":"A1234BC","prisonId":"HEI","visitorIds":["abc123","bcd321"],' +
            '"startTimestamp":"2022-08-24T11:00:00","endTimestamp":"2022-08-24T12:00:00","visitRestriction":"OPEN"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a visit booked audit message', async () => {
    await auditService.bookedVisit({
      applicationReference: 'aaa-bbb-ccc',
      visitReference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId,
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
            '{"applicationReference":"aaa-bbb-ccc","visitReference":"ab-cd-ef-gh","prisonerId":"A1234BC","prisonId":"HEI","visitorIds":["abc123","bcd321"],' +
            '"startTimestamp":"2022-08-24T11:00:00","endTimestamp":"2022-08-24T12:00:00","visitRestriction":"OPEN"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a notifications dismissed audit message', async () => {
    await auditService.dismissedNotifications({
      visitReference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId,
      reason: 'Dismiss reason',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'DISMISSED_NOTIFICATIONS',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"visitReference":"ab-cd-ef-gh","prisonerId":"A1234BC","prisonId":"HEI","reason":"Dismiss reason"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a cancelled visit audit message', async () => {
    await auditService.cancelledVisit({
      visitReference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId,
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

  it('sends a viewed visits page audit message', async () => {
    await auditService.viewedVisits({
      viewDate: '2022-06-01T12:12:12',
      prisonId,
      username: 'username',
      operationId: 'operation-id',
    })

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
    await auditService.printedVisitList({
      viewDate: '2022-06-01T12:12:12',
      prisonId,
      username: 'username',
      operationId: 'operation-id',
    })

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
    await auditService.visitRestrictionSelected({
      prisonerId: 'A1234BC',
      visitRestriction: 'CLOSED',
      visitorIds: ['abc123', 'bcd321'],
      username: 'username',
      operationId: 'operation-id',
    })

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
    await auditService.visitSearch({ searchTerms: 'ab-cd-ef-gh', username: 'username', operationId: 'operation-id' })

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
    await auditService.viewedVisitDetails({
      visitReference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId,
      username: 'username',
      operationId: 'operation-id',
    })

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

  it('sends a visit date blocked message', async () => {
    await auditService.blockedVisitDate({
      prisonId,
      date: '2024-09-06',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'BLOCKED_VISIT_DATE',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"prisonId":"HEI","date":"2024-09-06"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a visit date unblocked message', async () => {
    await auditService.unblockedVisitDate({
      prisonId,
      date: '2024-09-06',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'UNBLOCKED_VISIT_DATE',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"prisonId":"HEI","date":"2024-09-06"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a booker search audit message', async () => {
    await auditService.bookerSearch({
      search: 'booker@example.com',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'SEARCHED_BOOKERS',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"search":"booker@example.com"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a viewed booker audit message', async () => {
    await auditService.viewBooker({
      reference: 'aaaa-bbbb-cccc',
      prisonerIds: ['A1234BC', 'A4567DE'],
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'VIEWED_BOOKER',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"reference":"aaaa-bbbb-cccc","prisonerIds":["A1234BC","A4567DE"]}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a linked booker visitor audit message', async () => {
    await auditService.linkedBookerVisitor({
      reference: 'aaaa-bbbb-cccc',
      prisonerId: 'A1234BC',
      visitorId: '1234',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'LINKED_BOOKER_VISITOR',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"reference":"aaaa-bbbb-cccc","prisonerId":"A1234BC","visitorId":"1234"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a unlinked booker visitor audit message', async () => {
    await auditService.unlinkedBookerVisitor({
      reference: 'aaaa-bbbb-cccc',
      prisonerId: 'A1234BC',
      visitorId: '1234',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'UNLINKED_BOOKER_VISITOR',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"reference":"aaaa-bbbb-cccc","prisonerId":"A1234BC","visitorId":"1234"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends an approved visitor request audit message', async () => {
    await auditService.approvedVisitorRequest({
      requestReference: 'cccc-dddd-eeee',
      visitorId: '1234',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'APPROVED_VISITOR_REQUEST',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"requestReference":"cccc-dddd-eeee","visitorId":"1234"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a rejected visitor request audit message', async () => {
    await auditService.rejectedVisitorRequest({
      requestReference: 'cccc-dddd-eeee',
      rejectionReason: 'REJECT',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'REJECTED_VISITOR_REQUEST',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details: '{"requestReference":"cccc-dddd-eeee","rejectionReason":"REJECT"}',
        }),
        QueueUrl,
      },
    })
  })

  it('sends a visit balance adjusted audit message', async () => {
    await auditService.adjustedVisitBalance({
      prisonerId: 'A1234BC',
      voChange: 2,
      pvoChange: -1,
      reason: 'GOVERNOR_ADJUSTMENT',
      reasonDetails: 'comment text',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sqsClientInstance.send).toHaveBeenCalledTimes(1)
    expect(sqsClientInstance.send.mock.lastCall[0]).toMatchObject({
      input: {
        MessageBody: JSON.stringify({
          what: 'ADJUSTED_VISIT_BALANCE',
          when: fakeDate,
          operationId: 'operation-id',
          who: 'username',
          service: 'book-a-prison-visit-staff-ui',
          details:
            '{"prisonerId":"A1234BC","voChange":2,"pvoChange":-1,"reason":"GOVERNOR_ADJUSTMENT","reasonDetails":"comment text"}',
        }),
        QueueUrl,
      },
    })
  })
})
