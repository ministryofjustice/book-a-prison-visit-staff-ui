import type { RequestHandler, Router } from 'express'
import { format } from 'date-fns'
import config from '../config'
import { VisitInformation, PrisonerDetailsItem } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import { getResultsPagingLinks } from '../utils/utils'

export default function routes(
  router: Router,
  prisonerSearchService: PrisonerSearchService,
  visitSessionsService: VisitSessionsService
): Router {
  const get = (path: string | string[], ...handlers: RequestHandler[]) =>
    router.get(
      path,
      handlers.map(handler => asyncMiddleware(handler))
    )

  const getStartDate = (startDate: string): string => {
    const startDateObject = new Date(startDate).toString() === 'Invalid Date' ? new Date() : new Date(startDate)
    return format(startDateObject, 'yyyy-MM-dd')
  }

  const getVisitSlotsFromBookedVisits = (
    visits: VisitInformation[]
  ): {
    openSlots: { visitTime: string; sortField: string }[]
    closedSlots: { visitTime: string; sortField: string }[]
  } => {
    const openSlots = new Set<{ visitTime: string; sortField: string }>()
    const closedSlots = new Set<{ visitTime: string; sortField: string }>()

    visits.forEach((visit: VisitInformation) => {
      if (visit.visitRestriction === 'OPEN') {
        openSlots.add({
          visitTime: visit.visitTime,
          sortField: visit.startTimestamp,
        })
      } else {
        closedSlots.add({
          visitTime: visit.visitTime,
          sortField: visit.startTimestamp,
        })
      }
    })

    return {
      openSlots: [...openSlots],
      closedSlots: [...closedSlots],
    }
  }

  const sortByTimestamp = (
    a: { visitTime: string; sortField: string },
    b: { visitTime: string; sortField: string }
  ) => {
    if (a.sortField > b.sortField) {
      return 1
    }
    if (a.sortField < b.sortField) {
      return -1
    }

    return 0
  }

  function getFirstSlot({
    openSlots,
    closedSlots,
  }: {
    openSlots: { visitTime: string; sortField: string }[]
    closedSlots: { visitTime: string; sortField: string }[]
  }): string {
    let firstSlot: string

    if (openSlots.length > 0) {
      firstSlot = openSlots.sort(sortByTimestamp)[0].visitTime
    } else if (closedSlots.length > 0) {
      firstSlot = closedSlots.sort(sortByTimestamp)[0].visitTime
    }

    return firstSlot
  }

  function getSlotsSideMenuData({
    firstSlotTime,
    slotType = '',
    slotDate = '',
    startDate = '',
    openSlots,
    closedSlots,
  }: {
    firstSlotTime: string
    slotType: string
    slotDate: string
    startDate: string
    openSlots: { visitTime: string; sortField: string }[]
    closedSlots: { visitTime: string; sortField: string }[]
  }): {
    openSlots: { text: string; href: string; active: boolean }[]
    closedSlots: { text: string; href: string; active: boolean }[]
  } {
    const slotTimeCheck = slotDate === '' ? firstSlotTime : slotDate
    const url = `/visits?startDate=${startDate}&time=${slotDate}&type=${slotType}`
    const openSlotOptions = openSlots.sort(sortByTimestamp).map(slot => {
      return {
        text: slot.visitTime,
        href: url,
        active: slotTimeCheck === slot.visitTime,
      }
    })

    const closedSlotOptions = closedSlots.sort(sortByTimestamp).map(slot => {
      return {
        text: slot.visitTime,
        href: url,
        active: slotTimeCheck === slot.visitTime,
      }
    })

    return {
      openSlots: openSlotOptions,
      closedSlots: closedSlotOptions,
    }
  }

  get('/', async (req, res) => {
    const { type = 'OPEN', time = '', startDate = '' } = req.query
    const startDateString = getStartDate(startDate as string)
    const visits: VisitInformation[] = await visitSessionsService.getVisitsByDate({
      dateString: startDateString,
      username: res.locals.user?.username,
    })
    const slots = getVisitSlotsFromBookedVisits(visits)
    // get slots from scheduler

    // go through and find first slot for selection if valid.
    const firstSlotTime = getFirstSlot({ ...slots })

    const { openSlots, closedSlots } = getSlotsSideMenuData({
      firstSlotTime,
      slotType: type as string,
      slotDate: time as string,
      startDate: startDateString,
      ...slots,
    })

    // get filtered visits for p[risoner]
    const slotFilter = time === '' ? firstSlotTime : time
    const filteredVisits = visits.filter(visit => visit.visitTime === slotFilter)
    const prisonersForVisit = filteredVisits.map(visit => visit.prisonNumber)
    const currentPage = Number.parseInt((req.query.page || '1') as string, 10)
    const { pageSize } = config.apis.prisonerSearch

    let results: PrisonerDetailsItem[][] = []
    let numberOfResults = 0
    let numberOfPages = 1
    let next = 1
    let previous = 1

    if (prisonersForVisit.length > 0) {
      ;({ results, numberOfResults, numberOfPages, next, previous } =
        await prisonerSearchService.getPrisonersByPrisonerNumbers(
          prisonersForVisit,
          res.locals.user?.username,
          currentPage
        ))
    }

    const currentPageMax = currentPage * pageSize
    const to = numberOfResults < currentPageMax ? numberOfResults : currentPageMax
    const pageLinks = getResultsPagingLinks({
      pagesToShow: config.apis.prisonerSearch.pagesLinksToShow,
      numberOfPages,
      currentPage,
      searchParam: `startDate=${startDateString}`,
      searchUrl: '/visits/',
    })

    return res.render('pages/visits/summary', {
      startDate,
      closedSlots,
      openSlots,
      results,
      next,
      previous,
      numberOfResults,
      pageSize,
      from: (currentPage - 1) * pageSize + 1,
      to,
      pageLinks: numberOfPages <= 1 ? [] : pageLinks,
    })
  })

  return router
}
