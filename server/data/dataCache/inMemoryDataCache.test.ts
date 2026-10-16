import DataCache from './inMemoryDataCache'

describe('inMemoryDataCache', () => {
  let dataCache: DataCache

  const jsonData = { some: 'data' }

  beforeEach(() => {
    dataCache = new DataCache()
  })

  it('Can store and retrieve data', async () => {
    await dataCache.set('key', jsonData, 10)
    expect(await dataCache.get('key')).toStrictEqual(jsonData)
  })

  it('Expires data', async () => {
    await dataCache.set('key', jsonData, -1)
    expect(await dataCache.get('key')).toBe(null)
  })
})
