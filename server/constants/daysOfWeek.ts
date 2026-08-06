export const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const

export type DAYS_OF_WEEK = (typeof daysOfWeek)[number]
