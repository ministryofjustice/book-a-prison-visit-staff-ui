/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
beforeEach(() => {
  jest.resetModules()
})

describe('Visit cancellation reasons', () => {
  it('should return all visit cancellation reasons', () => {
    const visitCancellationReasons = require('./visitCancellationReasons').default

    expect(Object.keys(visitCancellationReasons)).toEqual([
      'VISITOR_CANCELLED',
      'ESTABLISHMENT_CANCELLED',
      'PRISONER_CANCELLED',
      'DETAILS_CHANGED_AFTER_BOOKING',
      'ADMINISTRATIVE_ERROR',
    ])
  })
})
