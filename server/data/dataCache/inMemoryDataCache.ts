import { DataCache } from './dataCache'

export default class InMemoryDataCache implements DataCache {
  map = new Map<string, { data: string; expiry: Date }>()

  public async set<DataType>(key: string, data: DataType, durationSeconds: number): Promise<void> {
    this.map.set(key, { data: JSON.stringify(data), expiry: new Date(Date.now() + durationSeconds * 1000) })
    return Promise.resolve()
  }

  public async get<DataType>(key: string): Promise<DataType | null> {
    if (!this.map.has(key) || this.map.get(key)!.expiry.getTime() < Date.now()) {
      return Promise.resolve(null)
    }
    const parsedData: DataType = JSON.parse(this.map.get(key)!.data)
    return Promise.resolve(parsedData)
  }
}
