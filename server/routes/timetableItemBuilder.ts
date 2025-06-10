import { format, parseISO } from 'date-fns'
import { SessionSchedule } from '../data/orchestrationApiTypes'
import { prisonerTimePretty } from '../utils/utils'

export type TimetableItem = {
  time: string
  type: string
  capacity: string
  groupNames: string
  frequency: string
  validToDate: string
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
    const time = `${prisonerTimePretty(`${selectedDate}T${schedule.sessionTimeSlot.startTime}`)} to ${prisonerTimePretty(`${selectedDate}T${schedule.sessionTimeSlot.endTime}`)}`

    const validToDate = schedule.sessionDateRange.validToDate
      ? format(parseISO(schedule.sessionDateRange.validToDate), dateFormat)
      : 'Not entered'

    let frequency = ''
    if (
      schedule.sessionDateRange.validToDate &&
      schedule.sessionDateRange.validFromDate === schedule.sessionDateRange.validToDate
    ) {
      frequency = 'One off'
    } else {
      frequency = schedule.weeklyFrequency === 1 ? 'Every week' : `Every ${schedule.weeklyFrequency} weeks`
    }

    if (schedule.capacity.open !== 0) {
      timetableItems.push({
        time,
        type: 'Open',
        capacity: `${schedule.capacity.open} tables`,
        groupNames: attendees(schedule),
        frequency,
        validToDate,
      })
    }

    if (schedule.capacity.closed !== 0) {
      timetableItems.push({
        time,
        type: 'Closed',
        capacity: `${schedule.capacity.closed} tables`,
        groupNames: attendees(schedule),
        frequency,
        validToDate,
      })
    }
  })

  return timetableItems
}

// Takes all group names for particular type, and joins together
const mergedGroupNames = (groupNames: string[]): string => {
  let nameString = ''
  groupNames.forEach((name, index) => {
    if (index === 0) {
      nameString = name
    } else if (index === groupNames.length - 1) {
      nameString = `${nameString} and ${name}`
    } else {
      nameString = `${nameString}, ${name}`
    }
  })
  return nameString
}

// Function to build description of groups included/excluded from this particular session
const attendees = ({
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

  const categoryNames = mergedGroupNames(prisonerCategoryGroupNames)
  const incentiveNames = mergedGroupNames(prisonerIncentiveLevelGroupNames)
  const locationNames = mergedGroupNames(prisonerLocationGroupNames)

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
