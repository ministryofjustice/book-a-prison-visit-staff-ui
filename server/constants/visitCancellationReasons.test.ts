/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
beforeEach(() => {
  jest.resetModules()
})

describe('Visit cancellation reasons - feature flag', () => {
  it('should return all visit cancellation reasons when review feature enabled', () => {
    jest.mock('../config', () => ({
      features: { reviewBookings: true },
    }))

    const visitCancellationReasons = require('./visitCancellationReasons').default

    expect(Object.keys(visitCancellationReasons)).toEqual([
      'VISITOR_CANCELLED',
      'ESTABLISHMENT_CANCELLED',
      'PRISONER_CANCELLED',
      'DETAILS_CHANGED_AFTER_BOOKING',
      'ADMINISTRATIVE_ERROR',
    ])
  })

  it('should NOT return DETAILS_CHANGED_AFTER_BOOKING when review feature disabled', () => {
    jest.mock('../config', () => ({
      features: { reviewBookings: false },
    }))

    const visitCancellationReasons = require('./visitCancellationReasons').default

    expect(Object.keys(visitCancellationReasons)).toEqual([
      'VISITOR_CANCELLED',
      'ESTABLISHMENT_CANCELLED',
      'PRISONER_CANCELLED',
      'ADMINISTRATIVE_ERROR',
    ])
  })
})
