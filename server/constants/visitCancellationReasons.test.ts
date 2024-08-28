import visitCancellationReasons from './visitCancellationReasons'

beforeEach(() => {
  jest.resetModules()
})

describe('Visit cancellation reasons', () => {
  it('should return all visit cancellation reasons', () => {
    expect(Object.keys(visitCancellationReasons)).toEqual([
      'VISITOR_CANCELLED',
      'ESTABLISHMENT_CANCELLED',
      'PRISONER_CANCELLED',
      'DETAILS_CHANGED_AFTER_BOOKING',
      'ADMINISTRATIVE_ERROR',
    ])
  })
})
