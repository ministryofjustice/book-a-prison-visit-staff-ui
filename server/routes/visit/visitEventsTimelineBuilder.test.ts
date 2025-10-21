import visitEventsTimelineBuilder, { MojTimelineItem } from './visitEventsTimelineBuilder'

describe('visitEventsTimelineBuilder - Build MoJ Timeline items from visit event history', () => {
  let params: Parameters<typeof visitEventsTimelineBuilder>[0]

  beforeEach(() => {
    params = {
      events: [],
      visitNotes: [],
    }
  })

  it('should return an empty array of timeline items if no event audit items found', () => {
    const expectedTimeline: MojTimelineItem[] = []
    const timeline = visitEventsTimelineBuilder(params)
    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should filter events and flip eventAudit order', () => {
    params.events = [
      {
        type: 'RESERVED_VISIT',
        applicationMethodType: 'NOT_APPLICABLE',
        actionedByFullName: null,
        userType: 'SYSTEM',
        createTimestamp: '2022-01-01T08:55:00',
      },
      {
        type: 'BOOKED_VISIT',
        applicationMethodType: 'WEBSITE',
        actionedByFullName: null,
        userType: 'PUBLIC',
        createTimestamp: '2022-01-01T09:00:00',
      },
      {
        type: 'UPDATED_VISIT',
        applicationMethodType: 'BY_PRISONER',
        actionedByFullName: 'User One',
        userType: 'STAFF',
        createTimestamp: '2022-01-01T10:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Updated' },
        text: 'Method: Prisoner request',
        datetime: { timestamp: '2022-01-01T10:00:00', type: 'datetime' },
        byline: { text: 'User One' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
      {
        label: { text: 'Booked' },
        text: 'Method: GOV.UK booking',
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        attributes: { 'data-test': 'timeline-entry-1' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for "Booked" - prisoner request', () => {
    params.events = [
      {
        type: 'BOOKED_VISIT',
        applicationMethodType: 'BY_PRISONER',
        actionedByFullName: 'User One',
        userType: 'STAFF',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Booked' },
        text: 'Method: Prisoner request',
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        byline: { text: 'User One' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for "Booked" - GOV.UK Booking', () => {
    params.events = [
      {
        type: 'BOOKED_VISIT',
        applicationMethodType: 'WEBSITE',
        actionedByFullName: null,
        userType: 'PUBLIC',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Booked' },
        text: 'Method: GOV.UK booking',
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for "Updated" - prisoner request', () => {
    params.events = [
      {
        type: 'UPDATED_VISIT',
        applicationMethodType: 'BY_PRISONER',
        actionedByFullName: 'User One',
        userType: 'STAFF',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Updated' },
        text: 'Method: Prisoner request',
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        byline: { text: 'User One' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for "Updated" - GOV.UK Booking', () => {
    params.events = [
      {
        type: 'UPDATED_VISIT',
        applicationMethodType: 'WEBSITE',
        actionedByFullName: null,
        userType: 'PUBLIC',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Updated' },
        text: 'Method: GOV.UK booking',
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for "Cancelled" - Reason: /free text/', () => {
    params.visitNotes = [
      {
        type: 'VISIT_OUTCOMES',
        text: 'Cancelled due to illness',
      },
    ]

    params.events = [
      {
        type: 'CANCELLED_VISIT',
        applicationMethodType: 'WEBSITE',
        actionedByFullName: 'User One',
        userType: 'STAFF',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Cancelled' },
        text: `Reason: ${params.visitNotes[0].text}`,
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        byline: { text: 'User One' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for "Cancelled" - Method: GOV.UK Cancellation', () => {
    params.events = [
      {
        type: 'CANCELLED_VISIT',
        applicationMethodType: 'WEBSITE',
        actionedByFullName: 'User One',
        userType: 'PUBLIC',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Cancelled' },
        text: 'Method: GOV.UK cancellation',
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        byline: { text: 'User One' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for "Cancelled" - Method: Prisoner request', () => {
    params.events = [
      {
        type: 'CANCELLED_VISIT',
        applicationMethodType: 'BY_PRISONER',
        actionedByFullName: 'User One',
        userType: 'STAFF',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Cancelled' },
        text: 'Method: Prisoner request',
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        byline: { text: 'User One' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for "Requested" - Method: GOV.UK', () => {
    params.events = [
      {
        type: 'REQUESTED_VISIT',
        applicationMethodType: 'WEBSITE',
        actionedByFullName: null,
        userType: 'PUBLIC',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Requested' },
        text: 'Method: GOV.UK',
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for Request "Approved"', () => {
    params.events = [
      {
        type: 'REQUESTED_VISIT_APPROVED',
        applicationMethodType: 'WEBSITE',
        actionedByFullName: 'User One',
        userType: 'STAFF',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Approved' },
        text: '',
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        byline: { text: 'User One' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for Request "Rejected"', () => {
    params.events = [
      {
        type: 'REQUESTED_VISIT_REJECTED',
        applicationMethodType: 'WEBSITE',
        actionedByFullName: 'User One',
        userType: 'STAFF',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Rejected' },
        text: '',
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        byline: { text: 'User One' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for "Withdrawn - Method: GOV.UK"', () => {
    params.events = [
      {
        type: 'REQUESTED_VISIT_WITHDRAWN',
        applicationMethodType: 'WEBSITE',
        actionedByFullName: null,
        userType: 'PUBLIC',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Withdrawn' },
        text: 'Method: GOV.UK',
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for "No change required" - Reason: /free text/', () => {
    params.events = [
      {
        type: 'IGNORE_VISIT_NOTIFICATIONS_EVENT',
        applicationMethodType: 'NOT_APPLICABLE',
        actionedByFullName: 'User One',
        userType: 'STAFF',
        createTimestamp: '2022-01-01T09:00:00',
        text: 'Prisoner returning',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'No change required' },
        text: `Reason: ${params.events[0].text}`,
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        byline: { text: 'User One' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })

  it('should return a timeline with an event for "Needs review" - Reason: prisoner transferred', () => {
    params.events = [
      {
        type: 'PRISONER_RECEIVED_EVENT',
        applicationMethodType: 'NOT_APPLICABLE',
        actionedByFullName: null,
        userType: 'SYSTEM',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ]

    const expectedTimeline: MojTimelineItem[] = [
      {
        label: { text: 'Needs review' },
        text: `Reason: Prisoner transferred`,
        datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
        attributes: { 'data-test': 'timeline-entry-0' },
      },
    ]

    const timeline = visitEventsTimelineBuilder(params)

    expect(timeline).toStrictEqual(expectedTimeline)
  })
})
