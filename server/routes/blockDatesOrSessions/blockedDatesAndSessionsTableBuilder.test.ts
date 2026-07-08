import TestData from '../testutils/testData'
import buildBlockedDatesAndSessionsTable, { BlockedDateOrSessionRow } from './blockedDatesAndSessionsTableBuilder'

describe('buildBlockedDatesAndSessionsTable', () => {
  it('should build table rows for full date and session exclusions', () => {
    const data = TestData.prisonAndSessionsExcludeDatesDto({
      fullDateExclusions: [
        { excludeDate: '2026-07-01', actionedBy: 'User One' },
        { excludeDate: '2026-07-05', actionedBy: 'User Two' },
      ],
      sessionExclusions: [
        TestData.sessionExcludeDateDto({
          excludeDate: { excludeDate: '2026-07-01', actionedBy: 'User Three' },
          sessionTemplateReference: 'session-1',
        }),
        TestData.sessionExcludeDateDto({
          excludeDate: { excludeDate: '2026-07-03', actionedBy: 'User Four' },
          sessionTimeSlot: { startTime: '13:00', endTime: '14:30' },
          sessionTemplateReference: 'session-2',
          prisonerCategoryGroupNames: ['Category A', 'Category B'],
        }),
      ],
    })

    const expectedTableRows: BlockedDateOrSessionRow[] = [
      // Row 1
      {
        date: '2026-07-01',
        when: 'All day',
        who: 'All prisoners',
        blockedBy: 'User One',
      },
      // Row 2
      {
        date: '2026-07-01',
        when: '10am to 11:30am',
        who: 'All prisoners',
        blockedBy: 'User Three',
        sessionTemplateReference: 'session-1',
      },
      // Row 3
      {
        date: '2026-07-03',
        when: '1pm to 2:30pm',
        who: 'Category A and Category B prisoners',
        blockedBy: 'User Four',
        sessionTemplateReference: 'session-2',
      },
      // Row 4
      {
        date: '2026-07-05',
        when: 'All day',
        who: 'All prisoners',
        blockedBy: 'User Two',
      },
    ]

    const result = buildBlockedDatesAndSessionsTable(data)

    expect(result).toStrictEqual(expectedTableRows)
  })

  it('should return an empty array when there are no exclusions', () => {
    const data = TestData.prisonAndSessionsExcludeDatesDto({ fullDateExclusions: [], sessionExclusions: [] })
    const result = buildBlockedDatesAndSessionsTable(data)
    expect(result).toEqual([])
  })
})
