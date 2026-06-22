const ALLOWED_FROM_PAGES = ['visit-search', 'visits', 'request', 'review', 'vo-history', 'prisoner'] as const
const MAX_VISIT_NAV_QUERY_LENGTH = 200

const VISIT_SEARCH_QUERY_KEYS = ['searchBlock1', 'searchBlock2', 'searchBlock3', 'searchBlock4'] as const
const VISITS_QUERY_KEYS = ['type', 'sessionReference', 'selectedDate', 'firstTabDate'] as const

const ALLOWED_FROM_PAGE_QUERY_KEYS: Partial<Record<VisitFromPage, readonly string[]>> = {
  'visit-search': VISIT_SEARCH_QUERY_KEYS,
  visits: VISITS_QUERY_KEYS,
}

export type VisitFromPage = (typeof ALLOWED_FROM_PAGES)[number]

export type VisitNavState = {
  fromPage?: VisitFromPage
  fromPageQuery?: string
}

const isAllowedVisitFromPage = (value: string): value is VisitFromPage =>
  (ALLOWED_FROM_PAGES as readonly string[]).includes(value)

const buildAllowedVisitNavQuery = (fromPage: VisitFromPage, query: string): string | undefined => {
  const allowedKeys = ALLOWED_FROM_PAGE_QUERY_KEYS[fromPage]
  if (!allowedKeys) return undefined

  const params = new URLSearchParams(query)
  const filteredParams = new URLSearchParams()

  for (const key of allowedKeys) {
    const value = params.get(key)
    if (value !== null && value !== '') {
      filteredParams.set(key, value)
    }
  }

  const queryString = filteredParams.toString()
  return queryString || undefined
}

export function extractVisitNavState({ from, query }: { from?: unknown; query?: unknown }): VisitNavState {
  const fromPage = typeof from === 'string' && isAllowedVisitFromPage(from) ? from : undefined
  const queryString = typeof query === 'string' ? query : undefined

  // Limit query string to prevent abuse, then keep only the keys relevant to the source page
  const fromPageQuery =
    queryString && queryString.length <= MAX_VISIT_NAV_QUERY_LENGTH && fromPage
      ? buildAllowedVisitNavQuery(fromPage, queryString)
      : undefined

  if (!fromPage) return {}
  return { fromPage, fromPageQuery }
}

export function buildVisitNavQuery(navState: VisitNavState): string {
  if (!navState.fromPage) return ''
  const params = new URLSearchParams({ from: navState.fromPage })
  if (navState.fromPageQuery) params.set('query', navState.fromPageQuery)
  return `?${params.toString()}`
}

export function appendNavStateToPath(path: string, navState: VisitNavState): string {
  const qs = buildVisitNavQuery(navState)
  return qs ? path + qs : path
}

export const getVisitDetailsBackLink = ({
  navState,
  prisonerNumber,
}: {
  navState: VisitNavState
  prisonerNumber: string
}): {
  backLinkHref: string
} => {
  const { fromPage, fromPageQuery } = navState

  switch (fromPage) {
    case 'visit-search':
      return {
        backLinkHref: fromPageQuery ? `/search/visit/results?${fromPageQuery}` : '/search/visit/results',
      }

    case 'visits':
      return {
        backLinkHref: fromPageQuery ? `/visits?${fromPageQuery}` : '/visits',
      }

    case 'request':
      return {
        backLinkHref: '/requested-visits',
      }

    case 'review':
      return {
        backLinkHref: '/review',
      }

    case 'vo-history':
      return {
        backLinkHref: `/prisoner/${prisonerNumber}/visiting-orders-history`,
      }

    case 'prisoner':
    default:
      return {
        backLinkHref: `/prisoner/${prisonerNumber}`,
      }
  }
}
