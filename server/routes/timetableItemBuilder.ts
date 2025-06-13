import { format, parseISO } from 'date-fns'
import { SessionSchedule } from '../data/orchestrationApiTypes'
import { prisonerTimePretty } from '../utils/utils'

export type TimetableItem = {
  time: string
  type: 'Open' | 'Closed'
  capacity: string
  attendees: string
  frequency: string
  endDate: string
}
// Builds timetable rows, using all session schedules for the selected date
export default ({
  schedules,
  selectedDate,
}: {
  schedules: SessionSchedule[]
  selectedDate: string
}): TimetableItem[] => {
  const dateFormat = 'd MMMM yyyy'
  const timetableItems: TimetableItem[] = []
  schedules.forEach(schedule => {
    const { validToDate, validFromDate } = schedule.sessionDateRange
    const { startTime, endTime } = schedule.sessionTimeSlot

    const time = `${prisonerTimePretty(`${selectedDate}T${startTime}`)} to ${prisonerTimePretty(`${selectedDate}T${endTime}`)}`

    const endDate = validToDate ? format(parseISO(validToDate), dateFormat) : 'Not entered'

    let frequency = 'One off'
    if (validFromDate !== validToDate) {
      frequency = schedule.weeklyFrequency === 1 ? 'Every week' : `Every ${schedule.weeklyFrequency} weeks`
    }

    if (schedule.capacity.open !== 0) {
      timetableItems.push({
        time,
        type: 'Open',
        capacity: `${schedule.capacity.open} tables`,
        attendees: buildAttendeesText(schedule),
        frequency,
        endDate,
      })
    }

    if (schedule.capacity.closed !== 0) {
      timetableItems.push({
        time,
        type: 'Closed',
        capacity: `${schedule.capacity.closed} tables`,
        attendees: buildAttendeesText(schedule),
        frequency,
        endDate,
      })
    }
  })

  return timetableItems
}

// Takes all group names for particular type, and joins together
const mergeGroupNames = (groupNames: string[]): string => {
  if (groupNames.length === 0) return ''
  if (groupNames.length === 1) return groupNames[0]
  if (groupNames.length === 2) return `${groupNames[0]} and ${groupNames[1]}`
  return `${groupNames.slice(0, -1).join(', ')} and ${groupNames[groupNames.length - 1]}`
}

// Function to build description of groups included/excluded from this particular session
const buildAttendeesText = ({
  prisonerCategoryGroupNames,
  prisonerIncentiveLevelGroupNames,
  prisonerLocationGroupNames,
  areCategoryGroupsInclusive,
  areIncentiveGroupsInclusive,
  areLocationGroupsInclusive,
}: SessionSchedule): string => {
  if (
    !prisonerCategoryGroupNames.length &&
    !prisonerIncentiveLevelGroupNames.length &&
    !prisonerLocationGroupNames.length
  ) {
    return 'All prisoners'
  }

  const categoryNames = mergeGroupNames(prisonerCategoryGroupNames)
  const incentiveNames = mergeGroupNames(prisonerIncentiveLevelGroupNames)
  const locationNames = mergeGroupNames(prisonerLocationGroupNames)

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
