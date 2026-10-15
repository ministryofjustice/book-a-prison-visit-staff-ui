export interface DataCache {
  set<DataType>(key: string, data: DataType, durationSeconds: number): Promise<void>
  get<DataType>(key: string): Promise<DataType | null>
}

export type DataCacheConfig = { key: string; ttlSecs: number }
