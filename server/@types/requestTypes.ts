import type { ParamsDictionary } from 'express-serve-static-core'
import type { Prison } from './bapv'

export interface BookerPrisonerParams extends ParamsDictionary {
  reference: string
  prisonerId: string
}

export interface BookerPrisonerVisitorParams extends ParamsDictionary {
  reference: string
  prisonerId: string
  visitorId: string
}

export interface PrisonerParams extends ParamsDictionary {
  prisonerId: string
}

export interface VisitorRequestParams extends ParamsDictionary {
  requestReference: string
}

export interface VisitReferenceParams extends ParamsDictionary {
  reference: string
}

export interface RequestWithSelectedEstablishment extends Express.Request {
  context: {
    selectedEstablishment: Prison
  }
}
