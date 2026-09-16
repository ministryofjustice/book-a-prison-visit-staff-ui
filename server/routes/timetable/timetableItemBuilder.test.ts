import { SessionSchedule } from '../../data/orchestrationApiTypes'
import TestData from '../testutils/testData'
import timetableItemBuilder, { TimetableItem } from './timetableItemBuilder'

describe('timetableItemBuilder - Build timetable rows from visit schedules', () => {
  let schedules: SessionSchedule[]

  beforeEach(() => {
    schedules = []
  })

  it('should return an empty array of timetable items if no visit schedules found', () => {
    const expectedTimetable: TimetableItem[] = []
    const timetable = timetableItemBuilder(schedules)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should return "all prisoners, all visitors" for who can attend, if no category group names present and not age restricted', () => {
    schedules = [
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
        prisoners: 'All prisoners',
        visitors: 'All visitors',
      },
    ]
    const timetable = timetableItemBuilder(schedules)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should correctly concatenate group names, dependant on number of names present', () => {
    schedules = [
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
        prisoners: 'Category 1 prisoners on Incentive 1 and Incentive 2 in Location 1, Location 2 and Location 3',
        visitors: 'All visitors',
      },
    ]
    const timetable = timetableItemBuilder(schedules)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should correctly show capacity when both open and closed tables are available', () => {
    schedules = [
      TestData.sessionSchedule({
        capacity: {
          open: 15,
          closed: 25,
        },
      }),
    ]
    const otherTimetableInformation = {
      time: '1:45pm to 3:45pm',
      prisoners: 'All prisoners',
      visitors: 'All visitors',
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
    const timetable = timetableItemBuilder(schedules)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should display correct group name orders, with different 3 group name combinations', () => {
    const groupNames = {
      prisonerCategoryGroupNames: ['Category'],
      prisonerIncentiveLevelGroupNames: ['Incentive'],
      prisonerLocationGroupNames: ['Location'],
    }
    schedules = [
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
      visitors: 'All visitors',
    } as const
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        prisoners: 'All prisoners except Category prisoners, prisoners on Incentive and prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Category prisoners except prisoners on Incentive and prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Category prisoners in Location except prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Prisoners on Incentive except Category prisoners and prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Prisoners on Incentive in Location except Category prisoners',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Category prisoners on Incentive except prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Category prisoners on Incentive in Location',
      },
    ]
    const timetable = timetableItemBuilder(schedules)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should display correct group name orders, with different 2 group name combinations (category incentive)', () => {
    const groupNames = {
      prisonerCategoryGroupNames: ['Category'],
      prisonerIncentiveLevelGroupNames: ['Incentive'],
      prisonerLocationGroupNames: [''],
    }
    schedules = [
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
      visitors: 'All visitors',
    } as const
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        prisoners: 'Category prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Category prisoners except prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Prisoners on Incentive except Category prisoners',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'All prisoners except Category prisoners and prisoners on Incentive',
      },
    ]
    const timetable = timetableItemBuilder(schedules)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should display correct information for which visitors can attend', () => {
    schedules = [
      TestData.sessionSchedule({
        isAgeRestricted: true,
        ageRestriction: 18,
      }),
      TestData.sessionSchedule({
        isAgeRestricted: true,
        ageRestriction: 16,
      }),
      TestData.sessionSchedule({
        isAgeRestricted: false,
        ageRestriction: 18,
      }),
      TestData.sessionSchedule({
        isAgeRestricted: false,
        ageRestriction: 16,
      }),
    ]
    const otherTimetableInformation = {
      time: '1:45pm to 3:45pm',
      type: 'Open',
      capacity: '40 tables',
      prisoners: 'All prisoners',
    } as const
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        visitors: 'Visitors aged 18 years old or older',
      },
      {
        ...otherTimetableInformation,
        visitors: 'Visitors aged 16 years old or older',
      },
      {
        ...otherTimetableInformation,
        visitors: 'All visitors',
      },
      {
        ...otherTimetableInformation,
        visitors: 'All visitors',
      },
    ]
    const timetable = timetableItemBuilder(schedules)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should display correct group name orders, with different 2 group name combinations (category location)', () => {
    const groupNames = {
      prisonerCategoryGroupNames: ['Category'],
      prisonerIncentiveLevelGroupNames: [''],
      prisonerLocationGroupNames: ['Location'],
    }
    schedules = [
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
      visitors: 'All visitors',
    } as const
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        prisoners: 'Category prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Category prisoners except prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Prisoners in Location except Category prisoners',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'All prisoners except Category prisoners and prisoners in Location',
      },
    ]
    const timetable = timetableItemBuilder(schedules)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should display correct group name orders, with different 2 group name combinations (incentive location)', () => {
    const groupNames = {
      prisonerCategoryGroupNames: [''],
      prisonerIncentiveLevelGroupNames: ['Incentive'],
      prisonerLocationGroupNames: ['Location'],
    }
    schedules = [
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
      visitors: 'All visitors',
    } as const
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        prisoners: 'Prisoners on Incentive in Location',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Prisoners on Incentive except prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Prisoners in Location except prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'All prisoners except prisoners on Incentive and prisoners in Location',
      },
    ]
    const timetable = timetableItemBuilder(schedules)
    expect(timetable).toStrictEqual(expectedTimetable)
  })

  it('should display correct group name orders, when just one group name present', () => {
    schedules = [
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
      visitors: 'All visitors',
    } as const
    const expectedTimetable: TimetableItem[] = [
      {
        ...otherTimetableInformation,
        prisoners: 'Category prisoners',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'All prisoners except Category prisoners',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'All prisoners except prisoners on Incentive',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'Prisoners in Location',
      },
      {
        ...otherTimetableInformation,
        prisoners: 'All prisoners except prisoners in Location',
      },
    ]
    const timetable = timetableItemBuilder(schedules)
    expect(timetable).toStrictEqual(expectedTimetable)
  })
})
