import { SessionSchedule } from '../../data/orchestrationApiTypes'
import { formatStartToEndTime, pluralise } from '../../utils/utils'

export type TimetableItem = {
  time: string
  type: 'Open' | 'Closed'
  capacity: string
  visitors: string
  prisoners: string
}

// Formats as, e.g.  "A, B and C" (and handles cases of zero, one or two items)
const listFormatter = new Intl.ListFormat('en-GB', {
  style: 'long',
  type: 'conjunction',
})

// Builds timetable rows, using all session schedules for the selected date
export default (schedules: SessionSchedule[]): TimetableItem[] => {
  const timetableItems: TimetableItem[] = []
  schedules.forEach(schedule => {
    const { startTime, endTime } = schedule.sessionTimeSlot

    const time = formatStartToEndTime(startTime, endTime)

    const otherTimetableInformation = {
      time,
      visitors: buildVisitorsText(schedule),
      prisoners: buildPrisonersText(schedule),
    }
    if (schedule.capacity.open !== 0) {
      timetableItems.push({
        ...otherTimetableInformation,
        type: 'Open',
        capacity: `${schedule.capacity.open} tables`,
      })
    }
    if (schedule.capacity.closed !== 0) {
      timetableItems.push({
        ...otherTimetableInformation,
        type: 'Closed',
        capacity: `${schedule.capacity.closed} tables`,
      })
    }
  })

  return timetableItems
}

// Function to build description of which visitors are allowed to attend session
export const buildVisitorsText = ({
  isAgeRestricted,
  ageRestriction,
}: Pick<SessionSchedule, 'isAgeRestricted' | 'ageRestriction'>): string => {
  return isAgeRestricted
    ? `Visitors aged ${ageRestriction} ${pluralise('year', ageRestriction)} old or older`
    : 'All visitors'
}

// Function to build description of groups included/excluded from this particular session
export const buildPrisonersText = ({
  prisonerCategoryGroupNames,
  prisonerIncentiveLevelGroupNames,
  prisonerLocationGroupNames,
  areCategoryGroupsInclusive,
  areIncentiveGroupsInclusive,
  areLocationGroupsInclusive,
}: Pick<
  SessionSchedule,
  | 'prisonerCategoryGroupNames'
  | 'prisonerIncentiveLevelGroupNames'
  | 'prisonerLocationGroupNames'
  | 'areCategoryGroupsInclusive'
  | 'areIncentiveGroupsInclusive'
  | 'areLocationGroupsInclusive'
>): string => {
  if (
    !prisonerCategoryGroupNames.length &&
    !prisonerIncentiveLevelGroupNames.length &&
    !prisonerLocationGroupNames.length
  ) {
    return 'All prisoners'
  }

  const categoryNames = listFormatter.format(prisonerCategoryGroupNames)
  const incentiveNames = listFormatter.format(prisonerIncentiveLevelGroupNames)
  const locationNames = listFormatter.format(prisonerLocationGroupNames)

  if (categoryNames && incentiveNames && locationNames) {
    if (areCategoryGroupsInclusive && areIncentiveGroupsInclusive && areLocationGroupsInclusive) {
      return `${categoryNames} prisoners on ${incentiveNames} in ${locationNames}`
    }
    if (areCategoryGroupsInclusive && areIncentiveGroupsInclusive && !areLocationGroupsInclusive) {
      return `${categoryNames} prisoners on ${incentiveNames} except prisoners in ${locationNames}`
    }
    if (!areCategoryGroupsInclusive && areIncentiveGroupsInclusive && areLocationGroupsInclusive) {
      return `Prisoners on ${incentiveNames} in ${locationNames} except ${categoryNames} prisoners`
    }
    if (!areCategoryGroupsInclusive && areIncentiveGroupsInclusive && !areLocationGroupsInclusive) {
      return `Prisoners on ${incentiveNames} except ${categoryNames} prisoners and prisoners in ${locationNames}`
    }
    if (areCategoryGroupsInclusive && !areIncentiveGroupsInclusive && areLocationGroupsInclusive) {
      return `${categoryNames} prisoners in ${locationNames} except prisoners on ${incentiveNames}`
    }
    if (areCategoryGroupsInclusive && !areIncentiveGroupsInclusive && !areLocationGroupsInclusive) {
      return `${categoryNames} prisoners except prisoners on ${incentiveNames} and prisoners in ${locationNames}`
    }
    if (!areCategoryGroupsInclusive && !areIncentiveGroupsInclusive && areLocationGroupsInclusive) {
      return `Prisoners in ${locationNames} except ${categoryNames} prisoners and prisoners on ${incentiveNames}`
    }
    return `All prisoners except ${categoryNames} prisoners, prisoners on ${incentiveNames} and prisoners in ${locationNames}`
  }

  if (categoryNames && incentiveNames) {
    if (areCategoryGroupsInclusive && areIncentiveGroupsInclusive) {
      return `${categoryNames} prisoners on ${incentiveNames}`
    }
    if (areCategoryGroupsInclusive && !areIncentiveGroupsInclusive) {
      return `${categoryNames} prisoners except prisoners on ${incentiveNames}`
    }
    if (!areCategoryGroupsInclusive && areIncentiveGroupsInclusive) {
      return `Prisoners on ${incentiveNames} except ${categoryNames} prisoners`
    }
    return `All prisoners except ${categoryNames} prisoners and prisoners on ${incentiveNames}`
  }

  if (categoryNames && locationNames) {
    if (areCategoryGroupsInclusive && areLocationGroupsInclusive) {
      return `${categoryNames} prisoners in ${locationNames}`
    }
    if (areCategoryGroupsInclusive && !areLocationGroupsInclusive) {
      return `${categoryNames} prisoners except prisoners in ${locationNames}`
    }
    if (!areCategoryGroupsInclusive && areLocationGroupsInclusive) {
      return `Prisoners in ${locationNames} except ${categoryNames} prisoners`
    }
    return `All prisoners except ${categoryNames} prisoners and prisoners in ${locationNames}`
  }

  if (incentiveNames && locationNames) {
    if (areIncentiveGroupsInclusive && areLocationGroupsInclusive) {
      return `Prisoners on ${incentiveNames} in ${locationNames}`
    }
    if (areIncentiveGroupsInclusive && !areLocationGroupsInclusive) {
      return `Prisoners on ${incentiveNames} except prisoners in ${locationNames}`
    }
    if (!areIncentiveGroupsInclusive && areLocationGroupsInclusive) {
      return `Prisoners in ${locationNames} except prisoners on ${incentiveNames}`
    }
    return `All prisoners except prisoners on ${incentiveNames} and prisoners in ${locationNames}`
  }

  if (categoryNames) {
    if (areCategoryGroupsInclusive) {
      return `${categoryNames} prisoners`
    }
    return `All prisoners except ${categoryNames} prisoners`
  }

  if (incentiveNames) {
    if (areIncentiveGroupsInclusive) {
      return `Prisoners on ${incentiveNames}`
    }
    return `All prisoners except prisoners on ${incentiveNames}`
  }

  if (areLocationGroupsInclusive) {
    return `Prisoners in ${locationNames}`
  }
  return `All prisoners except prisoners in ${locationNames}`
}
