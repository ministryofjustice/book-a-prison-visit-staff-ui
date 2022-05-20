import type { RequestHandler, Router } from 'express'
import { format } from 'date-fns'
import config from '../config'
import { ExtendedVisitInformation, PrisonerDetailsItem, VisitsPageSlot } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import { getResultsPagingLinks, sortByTimestamp } from '../utils/utils'

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

  function getSlotsSideMenuData({
    slotFilter,
    slotType = '',
    startDate = '',
    openSlots,
    closedSlots,
  }: {
    slotFilter: string
    slotType: string
    startDate: string
    openSlots: { visitTime: string; sortField: string }[]
    closedSlots: { visitTime: string; sortField: string }[]
  }): {
    openSlots: { text: string; href: string; active: boolean }[]
    closedSlots: { text: string; href: string; active: boolean }[]
  } {
    const url = `/visits?startDate=${startDate}&time=${slotFilter}&type=${slotType}`
    const openSlotOptions = openSlots.sort(sortByTimestamp).map(slot => {
      return {
        text: slot.visitTime,
        href: url,
        active: slotFilter === slot.visitTime,
      }
    })

    const closedSlotOptions = closedSlots.sort(sortByTimestamp).map(slot => {
      return {
        text: slot.visitTime,
        href: url,
        active: slotFilter === slot.visitTime,
      }
    })

    return {
      openSlots: openSlotOptions,
      closedSlots: closedSlotOptions,
    }
  }

  get('/', async (req, res) => {
    const maxSlotDefaults = {
      OPEN: 30,
      CLOSED: 3,
    }
    const { type = 'OPEN', time = '', startDate = '' } = req.query
    const visitType = ['OPEN', 'CLOSED'].includes(type as string) ? (type as string) : 'OPEN'
    const maxSlots = maxSlotDefaults[visitType]
    const startDateString = getStartDate(startDate as string)
    const {
      extendedVisitsInfo,
      slots,
    }: {
      extendedVisitsInfo: ExtendedVisitInformation[]
      slots: {
        openSlots: VisitsPageSlot[]
        closedSlots: VisitsPageSlot[]
        firstSlotTime: string
      }
    } = await visitSessionsService.getVisitsByDate({
      dateString: startDateString,
      username: res.locals.user?.username,
    })

    const slotFilter = time === '' ? slots.firstSlotTime : time

    const { openSlots, closedSlots } = getSlotsSideMenuData({
      slotType: visitType,
      slotFilter: slotFilter as string,
      startDate: startDateString,
      ...slots,
    })
    const slotsNav = []

    if (openSlots.length > 0) {
      slotsNav.push({
        heading: {
          text: 'Main visits room',
          classes: 'govuk-!-padding-top-0',
        },
        items: openSlots,
      })
    }

    if (closedSlots.length > 0) {
      slotsNav.push({
        heading: {
          text: 'Closed visits room',
          classes: 'govuk-!-padding-top-0',
        },
        items: closedSlots,
      })
    }

    const filteredVisits = extendedVisitsInfo.filter(
      visit => visit.visitTime === slotFilter && visit.visitRestriction === visitType
    )
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
      // totals,
      visitType,
      maxSlots,
      slotFilter,
      slotsNav,
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
