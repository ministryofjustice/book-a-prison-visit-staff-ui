import getUrlPrefix from './visitJourneyUtils'

describe('getUrlPrefix', () => {
  it('should return the URL prefix for a booking journey page', () => {
    expect(getUrlPrefix(false, undefined)).toBe('/book-a-visit')
  })
  it('should return the URL prefix for an update journey page', () => {
    expect(getUrlPrefix(true, 'ab-cd-ef-gh')).toBe('/visit/ab-cd-ef-gh/update')
  })
})
