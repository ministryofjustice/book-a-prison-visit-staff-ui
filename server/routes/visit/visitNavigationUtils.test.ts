import {
  appendNavStateToPath,
  buildVisitNavQuery,
  extractVisitNavState,
  getVisitDetailsBackLink,
  VisitNavState,
} from './visitNavigationUtils'

describe('visitNavigationUtils', () => {
  describe('extractVisitNavState', () => {
    it('should return fromPage and query when both are valid strings', () => {
      expect(extractVisitNavState({ from: 'visits', query: 'type=OPEN' })).toStrictEqual({
        fromPage: 'visits',
        fromPageQuery: 'type=OPEN',
      })
    })

    it('should retain only allowed query keys for visits', () => {
      expect(
        extractVisitNavState({
          from: 'visits',
          query: 'type=OPEN&sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01&extra=drop-me',
        }),
      ).toStrictEqual({
        fromPage: 'visits',
        fromPageQuery: 'type=OPEN&sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
      })
    })

    it('should retain only allowed query keys for visit search', () => {
      expect(
        extractVisitNavState({
          from: 'visit-search',
          query: 'searchBlock1=ab&searchBlock2=cd&searchBlock3=ef&searchBlock4=gh&unexpected=value',
        }),
      ).toStrictEqual({
        fromPage: 'visit-search',
        fromPageQuery: 'searchBlock1=ab&searchBlock2=cd&searchBlock3=ef&searchBlock4=gh',
      })
    })

    it('should drop disallowed query keys for pages that do not use them', () => {
      expect(extractVisitNavState({ from: 'request', query: 'type=OPEN&extra=drop-me' })).toStrictEqual({
        fromPage: 'request',
        fromPageQuery: undefined,
      })
    })

    it('should return fromPage without query when query is missing', () => {
      expect(extractVisitNavState({ from: 'request' })).toStrictEqual({
        fromPage: 'request',
        fromPageQuery: undefined,
      })
    })

    it('should return fromPage without query when query exceeds the max length', () => {
      const longQuery = 'x'.repeat(201)

      expect(extractVisitNavState({ from: 'visits', query: longQuery })).toStrictEqual({
        fromPage: 'visits',
        fromPageQuery: undefined,
      })
    })

    it('should retain query when it is exactly at the max length', () => {
      const maxLengthQuery = `type=${'x'.repeat(195)}`

      expect(maxLengthQuery.length).toBe(200)

      expect(extractVisitNavState({ from: 'visits', query: maxLengthQuery })).toStrictEqual({
        fromPage: 'visits',
        fromPageQuery: maxLengthQuery,
      })
    })

    it('should return empty navigation state when from value is not allowed', () => {
      expect(extractVisitNavState({ from: 'something-else', query: 'a=1' })).toStrictEqual({})
    })

    it('should return empty navigation state when from is not a string', () => {
      expect(extractVisitNavState({ from: 123, query: 'a=1' })).toStrictEqual({})
    })
  })

  describe('buildVisitNavQuery', () => {
    it('should return empty string when fromPage is missing', () => {
      expect(buildVisitNavQuery({})).toBe('')
    })

    it('should build query with only from', () => {
      expect(buildVisitNavQuery({ fromPage: 'visits' })).toBe('?from=visits')
    })

    it('should build query with encoded from and query values', () => {
      expect(buildVisitNavQuery({ fromPage: 'visit-search', fromPageQuery: 'a=1&b=two words' })).toBe(
        '?from=visit-search&query=a%3D1%26b%3Dtwo+words',
      )
    })
  })

  describe('appendNavStateToPath', () => {
    it('should return original path when no navigation state exists', () => {
      expect(appendNavStateToPath('/visit/ab-cd-ef-gh', {})).toBe('/visit/ab-cd-ef-gh')
    })

    it('should append query string when navigation state exists', () => {
      expect(appendNavStateToPath('/visit/ab-cd-ef-gh', { fromPage: 'visits', fromPageQuery: 'type=OPEN' })).toBe(
        '/visit/ab-cd-ef-gh?from=visits&query=type%3DOPEN',
      )
    })
  })

  describe('getVisitDetailsBackLink', () => {
    const prisonerNumber = 'A1234BC'

    it.each<{
      navState: VisitNavState
      expected: ReturnType<typeof getVisitDetailsBackLink>
    }>([
      {
        navState: { fromPage: 'visit-search', fromPageQuery: 'a=1' },
        expected: {
          backLinkHref: '/search/visit/results?a=1',
        },
      },
      {
        navState: { fromPage: 'visits', fromPageQuery: 'type=OPEN' },
        expected: {
          backLinkHref: '/visits?type=OPEN',
        },
      },
      {
        navState: { fromPage: 'request' },
        expected: {
          backLinkHref: '/requested-visits',
        },
      },
      {
        navState: { fromPage: 'review' },
        expected: {
          backLinkHref: '/review',
        },
      },
      {
        navState: { fromPage: 'vo-history' },
        expected: {
          backLinkHref: `/prisoner/${prisonerNumber}/visiting-orders-history`,
        },
      },
      {
        navState: { fromPage: 'prisoner' },
        expected: {
          backLinkHref: `/prisoner/${prisonerNumber}`,
        },
      },
      {
        navState: {},
        expected: {
          backLinkHref: `/prisoner/${prisonerNumber}`,
        },
      },
    ])('should resolve backlink for $navState.fromPage', ({ navState, expected }) => {
      expect(getVisitDetailsBackLink({ navState, prisonerNumber })).toStrictEqual(expected)
    })

    it('should handle missing optional query for visit-search and visits', () => {
      expect(
        getVisitDetailsBackLink({
          navState: { fromPage: 'visit-search' },
          prisonerNumber,
        }),
      ).toStrictEqual({
        backLinkHref: '/search/visit/results',
      })

      expect(
        getVisitDetailsBackLink({
          navState: { fromPage: 'visits' },
          prisonerNumber,
        }),
      ).toStrictEqual({
        backLinkHref: '/visits',
      })
    })
  })
})
