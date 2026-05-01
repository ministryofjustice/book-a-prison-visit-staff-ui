export interface BookerPrisonerParams {
  reference: string
  prisonerId: string
}

export interface BookerPrisonerVisitorParams {
  reference: string
  prisonerId: string
  visitorId: string
}

export interface PrisonerParams {
  prisonerId: string
}

export interface VisitorRequestParams {
  requestReference: string
}

export interface VisitReferenceParams {
  reference: string
}
