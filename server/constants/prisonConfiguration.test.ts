import getPrisonConfiguration from './prisonConfiguration'

describe('Prison configuration', () => {
  it('should return correct prison configuration for requested prisonId', () => {
    const prisonConfiguration = getPrisonConfiguration('HEI')

    expect(prisonConfiguration.selectVisitorsText.length).toBe(2)
  })

  it('should return default prison configuration when none available for requested prisonId', () => {
    const prisonConfiguration = getPrisonConfiguration('XYZ')

    expect(prisonConfiguration.selectVisitorsText.length).toBe(0)
  })
})
