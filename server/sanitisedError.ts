import type { ResponseError } from 'superagent'

export interface SanitisedError<Data = unknown> extends Error {
  text?: string
  status?: number
  headers?: unknown
  data?: Data
  stack: string
  message: string
}

export type UnsanitisedError = ResponseError

export default function sanitise<Data = unknown>(error: UnsanitisedError): SanitisedError<Data> {
  const e = new Error() as SanitisedError<Data>
  e.message = error.message
  e.stack = error.stack
  if (error.response) {
    e.text = error.response.text
    e.status = error.response.status
    e.headers = error.response.headers
    e.data = error.response.body
  }
  return e
}
