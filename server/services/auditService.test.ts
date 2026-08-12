import AuditService from './auditService'

const sendMessage = jest.fn().mockResolvedValue(undefined)

jest.mock('@ministryofjustice/hmpps-audit-client', () => {
  return {
    AuditClient: jest.fn().mockImplementation(() => ({ sendMessage })),
  }
})

const prisonId = 'HEI'

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

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'SEARCHED_PRISONERS',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { searchTerms: 'Smith', prisonId: 'HEI' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a view prisoner audit message', async () => {
    await auditService.viewPrisoner({
      prisonerId: 'A1234BC',
      prisonId,
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'VIEWED_PRISONER',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { prisonerId: 'A1234BC', prisonId: 'HEI' },
      },
      { logOnError: true, throwOnError: false },
    )
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

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'RESERVED_VISIT',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: {
          applicationReference: 'aaa-bbb-ccc',
          visitReference: 'ab-cd-ef-gh',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          visitorIds: ['abc123', 'bcd321'],
          startTimestamp: '2022-08-24T11:00:00',
          endTimestamp: '2022-08-24T12:00:00',
          visitRestriction: 'OPEN',
        },
      },
      { logOnError: true, throwOnError: false },
    )
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

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'BOOKED_VISIT',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: {
          applicationReference: 'aaa-bbb-ccc',
          visitReference: 'ab-cd-ef-gh',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          visitorIds: ['abc123', 'bcd321'],
          startTimestamp: '2022-08-24T11:00:00',
          endTimestamp: '2022-08-24T12:00:00',
          visitRestriction: 'OPEN',
        },
      },
      { logOnError: true, throwOnError: false },
    )
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

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'DISMISSED_NOTIFICATIONS',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { visitReference: 'ab-cd-ef-gh', prisonerId: 'A1234BC', prisonId: 'HEI', reason: 'Dismiss reason' },
      },
      { logOnError: true, throwOnError: false },
    )
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

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'CANCELLED_VISIT',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: {
          visitReference: 'ab-cd-ef-gh',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          reason: 'PRISONER_CANCELLED: illness',
        },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a viewed visits page audit message', async () => {
    await auditService.viewedVisits({
      viewDate: '2022-06-01T12:12:12',
      prisonId,
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'VIEWED_VISITS',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { viewDate: '2022-06-01T12:12:12', prisonId: 'HEI' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a zero VO overridden audit message', async () => {
    await auditService.overrodeZeroVO({ prisonerId: 'A1234BC', username: 'username', operationId: 'operation-id' })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'OVERRODE_ZERO_VO',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { prisonerId: 'A1234BC' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a visit restriction (open/closed) selected audit message', async () => {
    await auditService.visitRestrictionSelected({
      prisonerId: 'A1234BC',
      visitRestriction: 'CLOSED',
      visitorIds: ['abc123', 'bcd321'],
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'VISIT_RESTRICTION_SELECTED',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { prisonerId: 'A1234BC', visitRestriction: 'CLOSED', visitorIds: ['abc123', 'bcd321'] },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a visit search audit message', async () => {
    await auditService.visitSearch({ searchTerms: 'ab-cd-ef-gh', username: 'username', operationId: 'operation-id' })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'SEARCHED_VISITS',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { searchTerms: 'ab-cd-ef-gh' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a viewed visit details audit message', async () => {
    await auditService.viewedVisitDetails({
      visitReference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId,
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'VIEWED_VISIT_DETAILS',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { visitReference: 'ab-cd-ef-gh', prisonerId: 'A1234BC', prisonId: 'HEI' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a visit date blocked message', async () => {
    await auditService.blockedVisitDate({
      prisonId,
      date: '2024-09-06',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'BLOCKED_VISIT_DATE',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { prisonId: 'HEI', date: '2024-09-06' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a visit date unblocked message', async () => {
    await auditService.unblockedVisitDate({
      prisonId,
      date: '2024-09-06',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'UNBLOCKED_VISIT_DATE',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { prisonId: 'HEI', date: '2024-09-06' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a visit session blocked message', async () => {
    await auditService.blockedVisitSession({
      date: '2024-09-06',
      sessionReference: 'session-ref',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'BLOCKED_VISIT_SESSION',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { date: '2024-09-06', sessionReference: 'session-ref' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a visit session unblocked message', async () => {
    await auditService.unblockedVisitSession({
      date: '2024-09-06',
      sessionReference: 'session-ref',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'UNBLOCKED_VISIT_SESSION',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { date: '2024-09-06', sessionReference: 'session-ref' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a booker search audit message', async () => {
    await auditService.bookerSearch({
      search: 'booker@example.com',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'SEARCHED_BOOKERS',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { search: 'booker@example.com' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a viewed booker audit message', async () => {
    await auditService.viewBooker({
      reference: 'aaaa-bbbb-cccc',
      prisonerIds: ['A1234BC', 'A4567DE'],
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'VIEWED_BOOKER',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { reference: 'aaaa-bbbb-cccc', prisonerIds: ['A1234BC', 'A4567DE'] },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a linked booker visitor audit message', async () => {
    await auditService.linkedBookerVisitor({
      reference: 'aaaa-bbbb-cccc',
      prisonerId: 'A1234BC',
      visitorId: '1234',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'LINKED_BOOKER_VISITOR',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { reference: 'aaaa-bbbb-cccc', prisonerId: 'A1234BC', visitorId: '1234' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a unlinked booker visitor audit message', async () => {
    await auditService.unlinkedBookerVisitor({
      reference: 'aaaa-bbbb-cccc',
      prisonerId: 'A1234BC',
      visitorId: '1234',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'UNLINKED_BOOKER_VISITOR',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { reference: 'aaaa-bbbb-cccc', prisonerId: 'A1234BC', visitorId: '1234' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends an approved visit request audit message', async () => {
    await auditService.approvedVisitRequest({
      visitReference: 'ab-cd-ef-gh',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'APPROVED_VISIT_REQUEST',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { visitReference: 'ab-cd-ef-gh' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a rejected visit request audit message', async () => {
    await auditService.rejectedVisitRequest({
      visitReference: 'ab-cd-ef-gh',
      rejectionReason: 'ALERT_OR_RESTRICTION',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'REJECTED_VISIT_REQUEST',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { visitReference: 'ab-cd-ef-gh', rejectionReason: 'ALERT_OR_RESTRICTION' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends an approved visitor request audit message', async () => {
    await auditService.approvedVisitorRequest({
      requestReference: 'cccc-dddd-eeee',
      visitorId: '1234',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'APPROVED_VISITOR_REQUEST',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { requestReference: 'cccc-dddd-eeee', visitorId: '1234' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a rejected visitor request audit message', async () => {
    await auditService.rejectedVisitorRequest({
      requestReference: 'cccc-dddd-eeee',
      rejectionReason: 'REJECT',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'REJECTED_VISITOR_REQUEST',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { requestReference: 'cccc-dddd-eeee', rejectionReason: 'REJECT' },
      },
      { logOnError: true, throwOnError: false },
    )
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

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'ADJUSTED_VISIT_BALANCE',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: {
          prisonerId: 'A1234BC',
          voChange: 2,
          pvoChange: -1,
          reason: 'GOVERNOR_ADJUSTMENT',
          reasonDetails: 'comment text',
        },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a update prison allowances audit message', async () => {
    await auditService.updatedPrisonAllowances({
      prisonId: 'HEI',
      weekStartDay: 'MONDAY',
      remandVisitLimitPerWeek: 3,
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'UPDATED_VISIT_ALLOWANCES',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { weekStartDay: 'MONDAY', remandVisitLimitPerWeek: 3, prisonId: 'HEI' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a printed visit pass audit message', async () => {
    await auditService.printedVisitPass({
      visitReference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId: 'HEI',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'PRINTED_VISIT_PASS',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { visitReference: 'ab-cd-ef-gh', prisonerId: 'A1234BC', prisonId: 'HEI' },
      },
      { logOnError: true, throwOnError: false },
    )
  })

  it('sends a printed visit passes audit message', async () => {
    await auditService.printedVisitPasses({
      date: '2024-06-01',
      prisonId: 'HEI',
      username: 'username',
      operationId: 'operation-id',
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        action: 'PRINTED_VISIT_PASSES',
        who: 'username',
        correlationId: 'operation-id',
        subjectType: 'NOT_APPLICABLE',
        details: { date: '2024-06-01', prisonId: 'HEI' },
      },
      { logOnError: true, throwOnError: false },
    )
  })
})
