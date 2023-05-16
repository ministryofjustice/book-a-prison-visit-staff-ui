import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import {
  ChangeVisitSlotRequestDto,
  OutcomeDto,
  PrisonerProfile,
  ReserveVisitSlotDto,
  SupportType,
  Visit,
  VisitHistoryDetails,
} from './orchestrationApiTypes'
import { VisitSessionData } from '../@types/bapv'

export default class OrchestrationApiClient {
  private restClient: RestClient

  private visitType = 'SOCIAL'

  constructor(token: string) {
    this.restClient = new RestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, token)
  }

  // orchestration-visits-controller

  async bookVisit(applicationReference: string): Promise<Visit> {
    return this.restClient.put({ path: `/visits/${applicationReference}/book` })
  }

  async cancelVisit(reference: string, outcome: OutcomeDto): Promise<Visit> {
    return this.restClient.put({
      path: `/visits/${reference}/cancel`,
      data: outcome,
    })
  }

  async changeBookedVisit(visitSessionData: VisitSessionData): Promise<Visit> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restClient.put({
      path: `/visits/${visitSessionData.visitReference}/change`,
      data: <ReserveVisitSlotDto>{
        prisonerId: visitSessionData.prisoner.offenderNo,
        sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
        visitRestriction: visitSessionData.visitRestriction,
        startTimestamp: visitSessionData.visitSlot.startTimestamp,
        endTimestamp: visitSessionData.visitSlot.endTimestamp,
        visitContact,
        visitors: visitSessionData.visitors.map(visitor => {
          return {
            nomisPersonId: visitor.personId,
            visitContact: visitor.personId === mainContactId,
          }
        }),
        visitorSupport: visitSessionData.visitorSupport,
      },
    })
  }

  async changeReservedVisit(visitSessionData: VisitSessionData): Promise<Visit> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restClient.put({
      path: `/visits/${visitSessionData.applicationReference}/slot/change`,
      data: <ChangeVisitSlotRequestDto>{
        visitRestriction: visitSessionData.visitRestriction,
        startTimestamp: visitSessionData.visitSlot.startTimestamp,
        endTimestamp: visitSessionData.visitSlot.endTimestamp,
        visitContact,
        visitors: visitSessionData.visitors.map(visitor => {
          return {
            nomisPersonId: visitor.personId,
            visitContact: visitor.personId === mainContactId,
          }
        }),
        visitorSupport: visitSessionData.visitorSupport,
      },
    })
  }

  async reserveVisit(visitSessionData: VisitSessionData): Promise<Visit> {
    return this.restClient.post({
      path: '/visits/slot/reserve',
      data: <ReserveVisitSlotDto>{
        prisonerId: visitSessionData.prisoner.offenderNo,
        sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
        visitRestriction: visitSessionData.visitRestriction,
        startTimestamp: visitSessionData.visitSlot.startTimestamp,
        endTimestamp: visitSessionData.visitSlot.endTimestamp,
        visitors: visitSessionData.visitors.map(visitor => {
          return {
            nomisPersonId: visitor.personId,
          }
        }),
      },
    })
  }

  async getVisitHistory(reference: string): Promise<VisitHistoryDetails> {
    return this.restClient.get({ path: `/visits/${reference}/history` })
  }

  async getAvailableSupportOptions(): Promise<SupportType[]> {
    return this.restClient.get({
      path: '/visit-support',
    })
  }

  // prisoner-profile-controller

  async getPrisonerProfile(prisonId: string, prisonerId: string): Promise<PrisonerProfile> {
    return this.restClient.get({ path: `/prisoner/${prisonId}/${prisonerId}/profile` })
  }

  // orchestration-prisons-config-controller

  async getSupportedPrisonIds(): Promise<string[]> {
    return this.restClient.get({
      path: '/config/prisons/supported',
    })
  }

  private convertMainContactToVisitContact(mainContact: VisitSessionData['mainContact']): {
    visitContact: ReserveVisitSlotDto['visitContact']
    mainContactId: number
  } {
    const visitContact = mainContact
      ? {
          telephone: mainContact.phoneNumber,
          name: mainContact.contactName ? mainContact.contactName : mainContact.contact.name,
        }
      : undefined
    const mainContactId = mainContact && mainContact.contact ? mainContact.contact.personId : null

    return { visitContact, mainContactId }
  }
}
