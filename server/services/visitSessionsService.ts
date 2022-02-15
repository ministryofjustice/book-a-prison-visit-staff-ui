import { format, parseISO, getDay } from 'date-fns'
import { VisitSlot, VisitSlotList, VisitSlotsForDay, SystemToken } from '../@types/bapv'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'
import { VisitSession } from '../data/visitSchedulerApiTypes'

type VisitSchedulerApiClientBuilder = (token: string) => VisitSchedulerApiClient

export default class VisitSessionsService {
  constructor(
    private readonly visitSchedulerApiClientBuilder: VisitSchedulerApiClientBuilder,
    private readonly systemToken: SystemToken
  ) {}

  async getVisitSessions({
    username,
    dayOfTheWeek = '',
    timeOfDay = '',
  }: {
    username: string
    dayOfTheWeek?: string
    timeOfDay?: string
  }): Promise<VisitSlotList> {
    const token = await this.systemToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientBuilder(token)

    const visitSessions = await visitSchedulerApiClient.getVisitSessions()

    return visitSessions.reduce((slotList: VisitSlotList, visitSession: VisitSession, slotIdCounter: number) => {
      const startTimestamp = parseISO(visitSession.startTimestamp)
      const endTimestamp = parseISO(visitSession.endTimestamp)
      const startDayOfTheWeek = getDay(startTimestamp)

      if (dayOfTheWeek === '' || parseInt(dayOfTheWeek, 10) === startDayOfTheWeek) {
        // Month grouping for slots, e.g. 'February 2022'
        const slotMonth = format(startTimestamp, 'MMMM yyyy')
        if (!slotList[slotMonth]) slotList[slotMonth] = [] // eslint-disable-line no-param-reassign

        // Slots for the day, e.g. 'Monday 14 February'
        const slotDate = format(startTimestamp, 'EEEE d MMMM')
        let slotsForDay: VisitSlotsForDay = slotList[slotMonth].find(slot => slot.date === slotDate)
        if (slotsForDay === undefined) {
          slotsForDay = { date: slotDate, slots: { morning: [], afternoon: [] } }
          slotList[slotMonth].push(slotsForDay)
        }

        const newSlot: VisitSlot = {
          id: (slotIdCounter + 1).toString(),
          startTime: this.getFormattedTime(startTimestamp),
          endTime: this.getFormattedTime(endTimestamp),
          // @TODO this will need fixing to handle open/closed visits
          availableTables: visitSession.openVisitCapacity - visitSession.openVisitBookedCount,
        }

        // Add new Slot to morning / afternoon grouping
        if (startTimestamp.getHours() < 12) {
          if (timeOfDay === '' || timeOfDay === 'morning') {
            slotsForDay.slots.morning.push(newSlot)
          }
        } else if (timeOfDay === '' || timeOfDay === 'afternoon') {
          slotsForDay.slots.afternoon.push(newSlot)
        }
      }

      return slotList
    }, {})
  }

  // include minutes only if not on the hour; e.g. 10am / 10:30am
  private getFormattedTime(time: Date): string {
    return time.getMinutes() ? format(time, 'h:mmaaa') : format(time, 'haaa')
  }
}
