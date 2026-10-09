export interface DataCache {
  set<DataType>(key: string, data: DataType, durationSeconds: number): Promise<void>
  get<DataType>(key: string): Promise<DataType | null>
}
