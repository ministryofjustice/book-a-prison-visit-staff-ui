import TestData from './testutils/testData'
import timetableItemBuilder, { TimetableItem } from './timetableItemBuilder'

describe('timetableItemBuilder - Build timetable rows from visit schedules', () => {
  let params: Parameters<typeof timetableItemBuilder>[0]

  beforeEach(() => {
    params = {
      schedules: [],
      selectedDate: '2025-05-05',
    }
  })

  it('should return an empty array of timetable items if no visit schedules found', () => {
    const expectedTimetable: TimetableItem[] = []
    const timetable = timetableItemBuilder(params)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should return "all prisoners" for who can attend, if no category group names present', () => {
    params.schedules = [
      TestData.sessionSchedule({
        prisonerCategoryGroupNames: [],
        prisonerIncentiveLevelGroupNames: [],
        prisonerLocationGroupNames: [],
      }),
    ]

    const expectedTimetable: TimetableItem[] = [
      {
        time: '1:45pm to 3:45pm',
        type: 'Open',
        capacity: '40 tables',
        attendees: 'All prisoners',
        frequency: 'Every week',
        endDate: 'Not entered',
      },
    ]
    const timetable = timetableItemBuilder(params)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should correctly concatenate group names, dependant on number of names present', () => {
    params.schedules = [
      TestData.sessionSchedule({
        prisonerCategoryGroupNames: ['Category 1'],
        prisonerIncentiveLevelGroupNames: ['Incentive 1', 'Incentive 2'],
        prisonerLocationGroupNames: ['Location 1', 'Location 2', 'Location 3'],
      }),
    ]
    const expectedTimetable: TimetableItem[] = [
      {
        time: '1:45pm to 3:45pm',
        type: 'Open',
        capacity: '40 tables',
        attendees: 'Category 1 prisoners on Incentive 1 and Incentive 2 in Location 1, Location 2 and Location 3',
        frequency: 'Every week',
        endDate: 'Not entered',
      },
    ]
    const timetable = timetableItemBuilder(params)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should correctly display different schedule frequency options', () => {
    params.schedules = [
      TestData.sessionSchedule({
        sessionDateRange: {
          validToDate: '2025-05-05',
          validFromDate: '2025-05-05',
        },
      }),
      TestData.sessionSchedule({
        weeklyFrequency: 1,
      }),
      TestData.sessionSchedule({
        weeklyFrequency: 2,
      }),
    ]
    const otherTimetableInformation = {
      time: '1:45pm to 3:45pm',
      type: 'Open',
      capacity: '40 tables',
      attendees: 'All prisoners',
    }
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        frequency: 'One off',
        endDate: '5 May 2025',
      },
      {
        ...otherTimetableInformation,
        frequency: 'Every week',
        endDate: 'Not entered',
      },
      {
        ...otherTimetableInformation,
        frequency: 'Every 2 weeks',
        endDate: 'Not entered',
      },
    ]
    const timetable = timetableItemBuilder(params)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should correctly show capacity when both open and closed tables are available', () => {
    params.schedules = [
      TestData.sessionSchedule({
        capacity: {
          open: 15,
          closed: 25,
        },
      }),
    ]
    const otherTimetableInformation = {
      time: '1:45pm to 3:45pm',
      attendees: 'All prisoners',
      frequency: 'Every week',
      endDate: 'Not entered',
    }
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        type: 'Open',
        capacity: '15 tables',
      },
      {
        ...otherTimetableInformation,
        type: 'Closed',
        capacity: '25 tables',
      },
    ]
    const timetable = timetableItemBuilder(params)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should display correct group name orders, with different 3 group name combinations', () => {
    const groupNames = {
      prisonerCategoryGroupNames: ['Category'],
      prisonerIncentiveLevelGroupNames: ['Incentive'],
      prisonerLocationGroupNames: ['Location'],
    }
    params.schedules = [
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: false,
        areIncentiveGroupsInclusive: false,
        areLocationGroupsInclusive: false,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: true,
        areIncentiveGroupsInclusive: false,
        areLocationGroupsInclusive: false,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: true,
        areIncentiveGroupsInclusive: false,
        areLocationGroupsInclusive: true,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: false,
        areIncentiveGroupsInclusive: true,
        areLocationGroupsInclusive: false,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: false,
        areIncentiveGroupsInclusive: true,
        areLocationGroupsInclusive: true,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: true,
        areIncentiveGroupsInclusive: true,
        areLocationGroupsInclusive: false,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: true,
        areIncentiveGroupsInclusive: true,
        areLocationGroupsInclusive: true,
      }),
    ]
    const otherTimetableInformation = {
      time: '1:45pm to 3:45pm',
      type: 'Open',
      capacity: '40 tables',
      frequency: 'Every week',
      endDate: 'Not entered',
    }
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        attendees: 'All prisoners except Category prisoners, prisoners on Incentive and prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Category prisoners except prisoners on Incentive and prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Category prisoners in Location except prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Prisoners on Incentive except Category prisoners and prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Prisoners on Incentive in Location except Category prisoners',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Category prisoners on Incentive except prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Category prisoners on Incentive in Location',
      },
    ]
    const timetable = timetableItemBuilder(params)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should display correct group name orders, with different 2 group name combinations (category incentive)', () => {
    const groupNames = {
      prisonerCategoryGroupNames: ['Category'],
      prisonerIncentiveLevelGroupNames: ['Incentive'],
      prisonerLocationGroupNames: [''],
    }
    params.schedules = [
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: true,
        areIncentiveGroupsInclusive: true,
      }),
      TestData.sessionSchedule({
        ...groupNames,

        areCategoryGroupsInclusive: true,
        areIncentiveGroupsInclusive: false,
      }),
      TestData.sessionSchedule({
        ...groupNames,

        areCategoryGroupsInclusive: false,
        areIncentiveGroupsInclusive: true,
      }),
      TestData.sessionSchedule({
        ...groupNames,

        areCategoryGroupsInclusive: false,
        areIncentiveGroupsInclusive: false,
      }),
    ]
    const otherTimetableInformation = {
      time: '1:45pm to 3:45pm',
      type: 'Open',
      capacity: '40 tables',
      frequency: 'Every week',
      endDate: 'Not entered',
    }
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        attendees: 'Category prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Category prisoners except prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Prisoners on Incentive except Category prisoners',
      },
      {
        ...otherTimetableInformation,
        attendees: 'All prisoners except Category prisoners and prisoners on Incentive',
      },
    ]
    const timetable = timetableItemBuilder(params)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should display correct group name orders, with different 2 group name combinations (category location)', () => {
    const groupNames = {
      prisonerCategoryGroupNames: ['Category'],
      prisonerIncentiveLevelGroupNames: [''],
      prisonerLocationGroupNames: ['Location'],
    }
    params.schedules = [
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: true,
        areLocationGroupsInclusive: true,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: true,
        areLocationGroupsInclusive: false,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: false,
        areLocationGroupsInclusive: true,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areCategoryGroupsInclusive: false,
        areLocationGroupsInclusive: false,
      }),
    ]
    const otherTimetableInformation = {
      time: '1:45pm to 3:45pm',
      type: 'Open',
      capacity: '40 tables',
      frequency: 'Every week',
      endDate: 'Not entered',
    }
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        attendees: 'Category prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Category prisoners except prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Prisoners in Location except Category prisoners',
      },
      {
        ...otherTimetableInformation,
        attendees: 'All prisoners except Category prisoners and prisoners in Location',
      },
    ]
    const timetable = timetableItemBuilder(params)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should display correct group name orders, with different 2 group name combinations (incentive location)', () => {
    const groupNames = {
      prisonerCategoryGroupNames: [''],
      prisonerIncentiveLevelGroupNames: ['Incentive'],
      prisonerLocationGroupNames: ['Location'],
    }
    params.schedules = [
      TestData.sessionSchedule({
        ...groupNames,
        areIncentiveGroupsInclusive: true,
        areLocationGroupsInclusive: true,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areIncentiveGroupsInclusive: true,
        areLocationGroupsInclusive: false,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areIncentiveGroupsInclusive: false,
        areLocationGroupsInclusive: true,
      }),
      TestData.sessionSchedule({
        ...groupNames,
        areIncentiveGroupsInclusive: false,
        areLocationGroupsInclusive: false,
      }),
    ]
    const otherTimetableInformation = {
      time: '1:45pm to 3:45pm',
      type: 'Open',
      capacity: '40 tables',
      frequency: 'Every week',
      endDate: 'Not entered',
    }
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        attendees: 'Prisoners on Incentive in Location',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Prisoners on Incentive except prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Prisoners in Location except prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        attendees: 'All prisoners except prisoners on Incentive and prisoners in Location',
      },
    ]
    const timetable = timetableItemBuilder(params)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should display correct group name orders, when just one group name present', () => {
    params.schedules = [
      TestData.sessionSchedule({
        prisonerCategoryGroupNames: ['Category'],
        prisonerIncentiveLevelGroupNames: [''],
        prisonerLocationGroupNames: [''],
        areCategoryGroupsInclusive: true,
      }),
      TestData.sessionSchedule({
        prisonerCategoryGroupNames: ['Category'],
        prisonerIncentiveLevelGroupNames: [''],
        prisonerLocationGroupNames: [''],
        areCategoryGroupsInclusive: false,
      }),
      TestData.sessionSchedule({
        prisonerCategoryGroupNames: [''],
        prisonerIncentiveLevelGroupNames: ['Incentive'],
        prisonerLocationGroupNames: [''],
        areIncentiveGroupsInclusive: true,
      }),
      TestData.sessionSchedule({
        prisonerCategoryGroupNames: [''],
        prisonerIncentiveLevelGroupNames: ['Incentive'],
        prisonerLocationGroupNames: [''],
        areIncentiveGroupsInclusive: false,
      }),
      TestData.sessionSchedule({
        prisonerCategoryGroupNames: [''],
        prisonerIncentiveLevelGroupNames: [''],
        prisonerLocationGroupNames: ['Location'],
        areLocationGroupsInclusive: true,
      }),
      TestData.sessionSchedule({
        prisonerCategoryGroupNames: [''],
        prisonerIncentiveLevelGroupNames: [''],
        prisonerLocationGroupNames: ['Location'],
        areLocationGroupsInclusive: false,
      }),
    ]
    const otherTimetableInformation = {
      time: '1:45pm to 3:45pm',
      type: 'Open',
      capacity: '40 tables',
      frequency: 'Every week',
      endDate: 'Not entered',
    }
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        attendees: 'Category prisoners',
      },
      {
        ...otherTimetableInformation,
        attendees: 'All prisoners except Category prisoners',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        attendees: 'All prisoners except prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        attendees: 'Prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        attendees: 'All prisoners except prisoners in Location',
      },
    ]
    const timetable = timetableItemBuilder(params)
    expect(timetable).toStrictEqual(expectedTimetable)
  })
})
