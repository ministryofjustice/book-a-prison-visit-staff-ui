import { RedisClient } from '../redisClient'
import DataCache from './redisDataCache'

const redisClient = {
  get: jest.fn(),
  set: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
  isOpen: true,
} as unknown as jest.Mocked<RedisClient>

describe('redisDataCache', () => {
  let dataCache: DataCache

  const jsonData = { some: 'data' }
  const jsonDataAsString = '{"some":"data"}'

  beforeEach(() => {
    dataCache = new DataCache(redisClient as unknown as RedisClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('get data', () => {
    it('Can retrieve data', async () => {
      redisClient.get.mockResolvedValue(jsonDataAsString)

      await expect(dataCache.get('key')).resolves.toStrictEqual(jsonData)

      expect(redisClient.get).toHaveBeenCalledWith('dataCache_local:key')
    })

    it('Returns null if data is not valid JSON', async () => {
      redisClient.get.mockResolvedValue('not valid JSON')

      await expect(dataCache.get('key')).resolves.toBeNull()

      expect(redisClient.get).toHaveBeenCalledWith('dataCache_local:key')
    })

    it('Connects when no connection calling get data', async () => {
      ;(redisClient as unknown as Record<string, boolean>).isOpen = false

      await dataCache.get('key')

      expect(redisClient.connect).toHaveBeenCalledWith()
    })
  })

  describe('set data', () => {
    it('Can set data', async () => {
      await dataCache.set('key', jsonData, 10)

      expect(redisClient.set).toHaveBeenCalledWith('dataCache_local:key', jsonDataAsString, { EX: 10 })
    })

    it('Connects when no connection calling set data', async () => {
      ;(redisClient as unknown as Record<string, boolean>).isOpen = false

      await dataCache.set('key', jsonData, 10)

      expect(redisClient.connect).toHaveBeenCalledWith()
    })
  })
})
