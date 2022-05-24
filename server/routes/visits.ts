import type { RequestHandler, Router } from 'express'
import { format, parse, add } from 'date-fns'
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

  const getSelectedDate = (selectedDate: string): string => {
    const selectedDateObject =
      new Date(selectedDate).toString() === 'Invalid Date' ? new Date() : new Date(selectedDate)
    return format(selectedDateObject, 'yyyy-MM-dd')
  }

  const getDateTabs = (
    firstTabDate: string,
    tabDate: string,
    numberOfTabs: number
  ): {
    text: string
    href: string
    active: boolean
  }[] => {
    const selectedDateObject = parse(firstTabDate, 'yyyy-MM-dd', new Date())
    const tabs = []

    for (let tab = 0; tab < numberOfTabs; tab += 1) {
      const dateToUse = add(selectedDateObject, { days: tab })
      const dateCheck = format(dateToUse, 'yyyy-MM-dd')
      const item = {
        text: format(dateToUse, 'EEEE d MMMM yyyy'),
        href: `/visits?selectedDate=${dateCheck}&tabDate=${firstTabDate}`,
        active: dateCheck === tabDate,
      }

      tabs.push(item)
    }

    return tabs
  }

  function getSlotsSideMenuData({
    slotFilter,
    slotType = '',
    selectedDate = '',
    openSlots,
    closedSlots,
  }: {
    slotFilter: string
    slotType: string
    selectedDate: string
    openSlots: VisitsPageSlot[]
    closedSlots: VisitsPageSlot[]
  }): {
    heading: {
      text: string
      classes: string
    }
    items: {
      text: string
      href: string
      active: boolean
    }[]
  }[] {
    const openSlotOptions = openSlots.sort(sortByTimestamp).map(slot => {
      return {
        text: slot.visitTime,
        href: `/visits?selectedDate=${selectedDate}&time=${slot.visitTime}&type=OPEN`,
        active: slotFilter === slot.visitTime && slotType === slot.visitType,
      }
    })

    const closedSlotOptions = closedSlots.sort(sortByTimestamp).map(slot => {
      return {
        text: slot.visitTime,
        href: `/visits?selectedDate=${selectedDate}&time=${slot.visitTime}&type=CLOSED`,
        active: slotFilter === slot.visitTime && slotType === slot.visitType,
      }
    })

    const slotsNav = []

    if (openSlotOptions.length > 0) {
      slotsNav.push({
        heading: {
          text: 'Main visits room',
          classes: 'govuk-!-padding-top-0',
        },
        items: openSlotOptions,
      })
    }

    if (closedSlotOptions.length > 0) {
      slotsNav.push({
        heading: {
          text: 'Closed visits room',
          classes: 'govuk-!-padding-top-0',
        },
        items: closedSlotOptions,
      })
    }

    return slotsNav
  }

  get('/', async (req, res) => {
    const maxSlotDefaults = {
      OPEN: 30,
      CLOSED: 3,
    }
    const { type = 'OPEN', time = '', selectedDate = '' } = req.query
    const visitType = ['OPEN', 'CLOSED'].includes(type as string) ? (type as string) : 'OPEN'
    const maxSlots = maxSlotDefaults[visitType]
    const selectedDateString = getSelectedDate(selectedDate as string)
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
      dateString: selectedDateString,
      username: res.locals.user?.username,
    })

    const slotFilter = time === '' ? slots.firstSlotTime : time

    const slotsNav = getSlotsSideMenuData({
      slotType: visitType,
      slotFilter: slotFilter as string,
      selectedDate: selectedDateString,
      ...slots,
    })

    const selectedSlots = {
      open: slots.openSlots.find(slot => slot.visitTime === slotFilter) ?? { adults: 0, children: 0 },
      closed: slots.closedSlots.find(slot => slot.visitTime === slotFilter) ?? { adults: 0, children: 0 },
    }

    const totals = {
      adults: visitType === 'OPEN' ? selectedSlots.open.adults : selectedSlots.closed.adults,
      children: visitType === 'OPEN' ? selectedSlots.open.children : selectedSlots.closed.children,
    }

    const filteredVisits = extendedVisitsInfo.filter(
      visit => visit.visitTime === slotFilter && visit.visitRestriction === visitType
    )
    const prisonersForVisit = filteredVisits.map(visit => {
      return {
        visit: visit.reference,
        prisoner: visit.prisonNumber,
      }
    })
    const currentPage = Number.parseInt((req.query?.page || '1') as string, 10)
    const { pageSize } = config.apis.prisonerSearch

    let results: PrisonerDetailsItem[][] = []
    let numberOfResults = 0
    let numberOfPages = 1
    let next = 1
    let previous = 1

    if (prisonersForVisit.length > 0) {
      const queryStringForBackLink = new URLSearchParams({
        startDate: startDateString,
        type: visitType,
        time: slotFilter as string,
      }).toString()
      ;({ results, numberOfResults, numberOfPages, next, previous } =
        await prisonerSearchService.getPrisonersByPrisonerNumbers(
          prisonersForVisit,
          queryStringForBackLink,
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
      searchParam: `selectedDate=${selectedDateString}`,
      searchUrl: '/visits/',
    })

    return res.render('pages/visits/summary', {
      totals: {
        visitors: totals.adults + totals.children,
        ...totals,
      },
      visitType,
      maxSlots,
      slotTime: slotFilter,
      slotsNav,
      results,
      next,
      previous,
      numberOfResults,
      pageSize,
      from: (currentPage - 1) * pageSize + 1,
      to,
      pageLinks: numberOfPages <= 1 ? [] : pageLinks,
      dateTabs: getDateTabs(selectedDateString, selectedDateString, 3),
    })
  })

  return router
}
