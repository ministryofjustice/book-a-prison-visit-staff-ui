const getSingleRow = (selected: boolean, page: number): { href: string; selected: boolean; text: string } => {
  return {
    href: `/search/prisoner/results?search=search&page=${page}`,
    selected,
    text: page.toString(),
  }
}

export const getResultsPagingLinksTestData = [
  {
    description: 'Show 1 page, 1 page available, current page is 1',
    params: {
      pagesToShow: 1,
      numberOfPages: 1,
      currentPage: 1,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(true, 1)],
  },
  {
    description: 'Show 1 page, 2 pages available, current page is 1',
    params: {
      pagesToShow: 1,
      numberOfPages: 2,
      currentPage: 1,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(true, 1)],
  },
  {
    description: 'Show 1 page, 2 pages available, current page is 2',
    params: {
      pagesToShow: 1,
      numberOfPages: 2,
      currentPage: 2,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(true, 2)],
  },
  {
    description: 'Show 1 page, 3 pages available, current page is 1',
    params: {
      pagesToShow: 1,
      numberOfPages: 3,
      currentPage: 1,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(true, 1)],
  },
  {
    description: 'Show 1 page, 3 pages available, current page is 2',
    params: {
      pagesToShow: 1,
      numberOfPages: 3,
      currentPage: 2,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(true, 2)],
  },
  {
    description: 'Show 1 page, 3 pages available, current page is 3',
    params: {
      pagesToShow: 1,
      numberOfPages: 3,
      currentPage: 3,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(true, 3)],
  },
  {
    description: 'Show 2 pages, 1 page available, current page is 1',
    params: {
      pagesToShow: 2,
      numberOfPages: 1,
      currentPage: 1,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(true, 1)],
  },
  {
    description: 'Show 2 pages, 2 pages available, current page is 1',
    params: {
      pagesToShow: 2,
      numberOfPages: 2,
      currentPage: 1,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(true, 1), getSingleRow(false, 2)],
  },
  {
    description: 'Show 2 pages, 2 pages available, current page is 2',
    params: {
      pagesToShow: 2,
      numberOfPages: 2,
      currentPage: 2,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(false, 1), getSingleRow(true, 2)],
  },
  {
    description: 'Show 2 pages, 3 pages available, current page is 1',
    params: {
      pagesToShow: 2,
      numberOfPages: 3,
      currentPage: 1,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(true, 1), getSingleRow(false, 2)],
  },
  {
    description: 'Show 2 pages, 3 pages available, current page is 2',
    params: {
      pagesToShow: 2,
      numberOfPages: 3,
      currentPage: 2,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(true, 2), getSingleRow(false, 3)],
  },
  {
    description: 'Show 2 pages, 3 pages available, current page is 3',
    params: {
      pagesToShow: 2,
      numberOfPages: 3,
      currentPage: 3,
      searchParam: 'search=search',
      searchUrl: '/search/prisoner/results',
    },
    result: [getSingleRow(false, 2), getSingleRow(true, 3)],
  },
]

export const sortByTimestampData = [
  {
    description: 'a and b are equal',
    a: {
      visitTime: 'Test',
      sortField: '2020-04-05T12:12:00',
    },
    b: {
      visitTime: 'Test',
      sortField: '2020-04-05T12:12:00',
    },
    result: 0,
  },
  {
    description: 'a is greater than b',
    a: {
      visitTime: 'Test',
      sortField: '2020-04-06T12:12:00',
    },
    b: {
      visitTime: 'Test',
      sortField: '2020-04-05T12:12:00',
    },
    result: 1,
  },
  {
    description: 'a is less than b',
    a: {
      visitTime: 'Test',
      sortField: '2020-04-05T12:12:00',
    },
    b: {
      visitTime: 'Test',
      sortField: '2020-04-06T12:12:00',
    },
    result: -1,
  },
]
