import { format, parseISO, getDay } from 'date-fns'
import logger from '../../logger'
import { VisitSlot, VisitSlotList, VisitSlotsForDay, SystemToken, VisitSessionData } from '../@types/bapv'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'
import { VisitSession, Visit } from '../data/visitSchedulerApiTypes'

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
          startTimestamp: visitSession.startTimestamp,
          endTimestamp: visitSession.endTimestamp,
          // @TODO this will need fixing to handle open/closed visits
          availableTables: visitSession.openVisitCapacity - visitSession.openVisitBookedCount,
          visitRoomName: visitSession.visitRoomName,
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

  async createVisit({ username, visitData }: { username: string; visitData: VisitSessionData }): Promise<string> {
    const token = await this.systemToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientBuilder(token)

    const reservation = await visitSchedulerApiClient.createVisit(visitData)
    logger.info(`Created visit ${reservation?.id} for offender ${visitData.prisoner.offenderNo}`)

    return reservation.id ? reservation.id : undefined
  }

  async updateVisit({
    username,
    visitData,
    visitStatus = 'RESERVED',
  }: {
    username: string
    visitData: VisitSessionData
    visitStatus?: string
  }): Promise<Visit> {
    const token = await this.systemToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientBuilder(token)

    const visit = await visitSchedulerApiClient.updateVisit(visitData, visitStatus)
    logger.info(`Updated visit ${visit.id} (status = ${visitStatus}) for offender ${visitData.prisoner.offenderNo}`)

    return visit
  }
}
