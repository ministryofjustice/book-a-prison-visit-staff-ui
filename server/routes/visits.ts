import type { RequestHandler, Router } from 'express'
import config from '../config'
import { ExtendedVisitInformation, PrisonerDetailsItem, VisitsPageSlot } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import AuditService from '../services/auditService'
import { getResultsPagingLinks } from '../utils/utils'
import { getDateTabs, getParsedDateFromQueryString, getSlotsSideMenuData } from './visitsUtils'

export default function routes(
  router: Router,
  prisonerSearchService: PrisonerSearchService,
  visitSessionsService: VisitSessionsService,
  auditService: AuditService,
): Router {
  const get = (path: string | string[], ...handlers: RequestHandler[]) =>
    router.get(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )
  const post = (path: string | string[], ...handlers: RequestHandler[]) =>
    router.post(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )

  get('/', async (req, res) => {
    const { type = 'OPEN', time = '', selectedDate = '', firstTabDate = '' } = req.query
    let visitType = ['OPEN', 'CLOSED', 'UNKNOWN'].includes(type as string) ? (type as string) : 'OPEN'
    const selectedDateString = getParsedDateFromQueryString(selectedDate as string)
    const {
      extendedVisitsInfo,
      slots,
    }: {
      extendedVisitsInfo: ExtendedVisitInformation[]
      slots: {
        openSlots: VisitsPageSlot[]
        closedSlots: VisitsPageSlot[]
        unknownSlots: VisitsPageSlot[]
        firstSlotTime: string
      }
    } = await visitSessionsService.getVisitsByDate({
      dateString: selectedDateString,
      username: res.locals.user?.username,
      prisonId: req.session.selectedEstablishment.prisonId,
    })

    if (visitType === 'OPEN' && slots.openSlots.length === 0) {
      if (slots.closedSlots.length > 0) {
        visitType = 'CLOSED'
      } else if (slots.unknownSlots.length > 0) {
        visitType = 'UNKNOWN'
      }
    }

    const maxSlotDefaults = {
      OPEN: 30,
      CLOSED: 3,
      UNKNOWN: 30,
    }
    const maxSlots = maxSlotDefaults[visitType] ?? 0
    const firstTabDateString = getParsedDateFromQueryString(firstTabDate as string)

    const slotFilter = time === '' ? slots.firstSlotTime : time
    const queryParams = new URLSearchParams({
      type: visitType,
      time: slotFilter as string,
      selectedDate: selectedDateString,
      firstTabDate: firstTabDateString,
    }).toString()

    const slotsNav = getSlotsSideMenuData({
      slotType: visitType,
      slotFilter: slotFilter as string,
      selectedDate: selectedDateString,
      firstTabDate: firstTabDateString,
      ...slots,
    })
    const selectedSlots = {
      open: slots.openSlots.find(slot => slot.visitTime === slotFilter) ?? { adults: 0, children: 0 },
      closed: slots.closedSlots.find(slot => slot.visitTime === slotFilter) ?? { adults: 0, children: 0 },
      unknown: slots.unknownSlots.find(slot => slot.visitTime === slotFilter) ?? { adults: 0, children: 0 },
    }
    const totals = {
      adults: selectedSlots[visitType.toLowerCase()].adults,
      children: selectedSlots[visitType.toLowerCase()].children,
    }

    const filteredVisits = extendedVisitsInfo.filter(
      visit => visit.visitTime === slotFilter && visit.visitRestriction === visitType,
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
      ;({ results, numberOfResults, numberOfPages, next, previous } =
        await prisonerSearchService.getPrisonersByPrisonerNumbers(
          prisonersForVisit,
          queryParams,
          res.locals.user?.username,
          currentPage,
        ))
    }

    const currentPageMax = currentPage * pageSize
    const to = numberOfResults < currentPageMax ? numberOfResults : currentPageMax
    const pageLinks = getResultsPagingLinks({
      pagesToShow: config.apis.prisonerSearch.pagesLinksToShow,
      numberOfPages,
      currentPage,
      searchParam: queryParams,
      searchUrl: '/visits/',
    })

    await auditService.viewedVisits({
      viewDate: selectedDateString,
      username: res.locals.user?.username,
      operationId: res.locals.appInsightsOperationId,
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
      dateTabs: getDateTabs(selectedDateString, firstTabDateString, 3),
      queryParams,
    })
  })

  post('/', async (req, res) => {
    const day = (req.body['date-picker-day'] as string).padStart(2, '0')
    const month = (req.body['date-picker-month'] as string).padStart(2, '0')
    const year = (req.body['date-picker-year'] as string).padStart(4, '0')

    const selectedDateString = getParsedDateFromQueryString(`${year}-${month}-${day}`)
    const queryParams = new URLSearchParams({
      selectedDate: selectedDateString,
      firstTabDate: selectedDateString,
    }).toString()

    return res.redirect(`/visits?${queryParams}`)
  })

  return router
}
