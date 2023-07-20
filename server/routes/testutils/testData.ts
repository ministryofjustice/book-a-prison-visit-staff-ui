import { Prison } from '../../@types/bapv'
import {
  Alert,
  PrisonerProfile,
  SessionCapacity,
  SessionSchedule,
  SupportType,
  Visit,
  VisitHistoryDetails,
  VisitSession,
} from '../../data/orchestrationApiTypes'
import { CaseLoad, OffenderRestriction } from '../../data/prisonApiTypes'
import { CurrentIncentive, Prisoner } from '../../data/prisonerOffenderSearchTypes'
import { Address, Contact, Restriction } from '../../data/prisonerContactRegistryApiTypes'
import { ScheduledEvent } from '../../data/whereaboutsApiTypes'

export default class TestData {
  static address = ({
    flat = '23B',
    premise = 'Premises',
    street = '123 The Street',
    locality = 'Springfield',
    town = 'Coventry',
    postalCode = 'C1 2AB',
    county = 'West Midlands',
    country = 'England',
    primary = true,
    noFixedAddress = false,
    phones = [],
    addressUsages = [],
  }: Partial<Address> = {}): Address =>
    ({
      flat,
      premise,
      street,
      locality,
      town,
      postalCode,
      county,
      country,
      primary,
      noFixedAddress,
      phones,
      addressUsages,
    } as Address)

  static alert = ({
    alertType = 'U',
    alertTypeDescription = 'COVID unit management',
    alertCode = 'UPIU',
    alertCodeDescription = 'Protective Isolation Unit',
    comment = 'Alert comment',
    dateCreated = '2023-01-02',
    dateExpires = undefined,
    expired = false,
    active = true,
  }: Partial<Alert> = {}): Alert =>
    ({
      alertType,
      alertTypeDescription,
      alertCode,
      alertCodeDescription,
      comment,
      dateCreated,
      dateExpires,
      expired,
      active,
    } as Alert)

  static caseLoads = ({
    caseLoads = [
      {
        caseLoadId: 'BLI',
        description: 'Bristol (HMP)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: false,
      },
      {
        caseLoadId: 'HEI',
        description: 'Hewell (HMP)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
      },
    ] as CaseLoad[],
  } = {}): CaseLoad[] => caseLoads

  static contact = ({
    personId = 4321,
    firstName = 'Jeanette',
    lastName = 'Smith',
    dateOfBirth = '1986-07-28',
    relationshipCode = 'WIFE',
    relationshipDescription = 'Wife',
    contactType = 'S',
    approvedVisitor = true,
    emergencyContact = false,
    nextOfKin = false,
    restrictions = [],
    addresses = [this.address()],
  }: Partial<Contact> = {}): Contact =>
    ({
      personId,
      firstName,
      lastName,
      dateOfBirth,
      relationshipCode,
      relationshipDescription,
      contactType,
      approvedVisitor,
      emergencyContact,
      nextOfKin,
      restrictions,
      addresses,
    } as Contact)

  static currentIncentive = ({
    level = {
      code: 'STD',
      description: 'Standard',
    },
  }: Partial<CurrentIncentive> = {}): CurrentIncentive => ({ level } as CurrentIncentive)

  static offenderRestriction = ({
    restrictionId = 0,
    comment = 'Details about this restriction',
    restrictionType = 'RESTRICTED',
    restrictionTypeDescription = 'Restricted',
    startDate = '2022-03-15',
    expiryDate = '',
    active = true,
  }: Partial<OffenderRestriction> = {}): OffenderRestriction => ({
    restrictionId,
    comment,
    restrictionType,
    restrictionTypeDescription,
    startDate,
    expiryDate,
    active,
  })

  static prisoner = ({
    prisonerNumber = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    dateOfBirth = '1975-04-02',
    prisonId = 'HEI',
    prisonName = 'HMP Hewell',
    cellLocation = '1-1-C-028',
    currentIncentive = this.currentIncentive(),
  }: Partial<Prisoner> = {}): Prisoner =>
    ({
      prisonerNumber,
      firstName,
      lastName,
      dateOfBirth,
      prisonId,
      prisonName,
      cellLocation,
      currentIncentive,
    } as Prisoner)

  static prisons = ({
    prisons = [
      {
        prisonId: 'HEI',
        prisonName: 'Hewell (HMP)',
      },
      {
        prisonId: 'BLI',
        prisonName: 'Bristol (HMP & YOI)',
      },
    ] as Prison[],
  } = {}): Prison[] => prisons

  static prisonerProfile = ({
    prisonerId = 'A1234BC',
    prisonId = 'HEI',
    firstName = 'JOHN',
    lastName = 'SMITH',
    dateOfBirth = '1975-04-02',
    cellLocation = '1-1-C-028',
    prisonName = 'Hewell (HMP)',
    category = 'Cat C',
    convictedStatus = 'Convicted',
    incentiveLevel = 'Standard',
    alerts = [],
    visitBalances = {
      remainingVo: 1,
      remainingPvo: 2,
      latestIepAdjustDate: '2021-04-21',
      latestPrivIepAdjustDate: '2021-12-01',
    },
    visits = [],
  }: Partial<PrisonerProfile> = {}): PrisonerProfile =>
    ({
      prisonerId,
      prisonId,
      firstName,
      lastName,
      dateOfBirth,
      cellLocation,
      prisonName,
      category,
      convictedStatus,
      incentiveLevel,
      alerts,
      visitBalances,
      visits,
    } as PrisonerProfile)

  // Visitor restrictions
  static restriction = ({
    restrictionType = 'NONCON',
    restrictionTypeDescription = 'Non-Contact Visit',
    startDate = '2023-02-01',
    expiryDate = undefined,
    globalRestriction = true,
    comment = 'Restriction test comment',
  }: Partial<Restriction> = {}): Restriction => ({
    restrictionType,
    restrictionTypeDescription,
    startDate,
    expiryDate,
    globalRestriction,
    comment,
  })

  static scheduledEvent = ({
    bookingId = 12345,
    startTime = '2022-02-14T10:00:00',
    endTime = '2022-02-14T11:00:00',
    eventSourceDesc = 'Educational activity',
  }: Partial<ScheduledEvent> = {}): ScheduledEvent => ({
    bookingId,
    startTime,
    endTime,
    eventSourceDesc,
  })

  static sessionCapacity = ({ open = 30, closed = 3 }: Partial<SessionCapacity> = {}): SessionCapacity =>
    ({ open, closed } as SessionCapacity)

  static sessionSchedule = ({
    sessionTemplateReference = '1',
    sessionTimeSlot = {
      startTime: '13:45',
      endTime: '15:45',
    },
    sessionDateRange = {
      validFromDate: '2023-02-01',
      validToDate: undefined,
    },
    capacity = { closed: 0, open: 40 },
    prisonerLocationGroupNames = [],
    prisonerCategoryGroupNames = [],
    prisonerIncentiveLevelGroupNames = [],
    weeklyFrequency = 1,
  }: Partial<SessionSchedule> = {}): SessionSchedule => ({
    sessionTemplateReference,
    sessionTimeSlot,
    sessionDateRange,
    capacity,
    prisonerLocationGroupNames,
    prisonerCategoryGroupNames,
    prisonerIncentiveLevelGroupNames,
    weeklyFrequency,
  })

  static supportedPrisons = ({
    prisons = <Record<string, string>>{
      HEI: 'Hewell (HMP)',
      BLI: 'Bristol (HMP & YOI)',
    },
  } = {}): Record<string, string> => prisons

  static supportedPrisonIds = ({ prisonIds = ['HEI', 'BLI'] } = {}): string[] => prisonIds

  static supportTypes = ({
    supportTypes = [
      {
        type: 'WHEELCHAIR',
        description: 'Wheelchair ramp',
      },
      {
        type: 'INDUCTION_LOOP',
        description: 'Portable induction loop for people with hearing aids',
      },
      {
        type: 'BSL_INTERPRETER',
        description: 'British Sign Language (BSL) Interpreter',
      },
      {
        type: 'MASK_EXEMPT',
        description: 'Face covering exemption',
      },
      {
        type: 'OTHER',
        description: 'Other',
      },
    ] as SupportType[],
  } = {}): SupportType[] => supportTypes

  static visit = ({
    applicationReference = 'aaa-bbb-ccc',
    reference = 'ab-cd-ef-gh',
    prisonerId = 'A1234BC',
    prisonId = 'HEI',
    sessionTemplateReference = 'v9d.7ed.7u',
    visitRoom = 'Visit room 1',
    visitType = 'SOCIAL',
    visitStatus = 'BOOKED',
    outcomeStatus = undefined,
    visitRestriction = 'OPEN',
    startTimestamp = '2022-01-14T10:00:00',
    endTimestamp = '2022-01-14T11:00:00',
    visitNotes = [
      {
        type: 'VISIT_COMMENT',
        text: 'Example of a visit comment',
      },
      {
        type: 'VISITOR_CONCERN',
        text: 'Example of a visitor concern',
      },
    ],
    visitContact = {
      name: 'Jeanette Smith',
      telephone: '01234 567890',
    },
    visitors = [
      {
        nomisPersonId: 4321,
        visitContact: true,
      },
      {
        nomisPersonId: 4322,
        visitContact: false,
      },
    ],
    visitorSupport = [
      {
        type: 'WHEELCHAIR',
      },
      {
        type: 'OTHER',
        text: 'custom request',
      },
    ],
    createdTimestamp = '2022-01-01T09:00:00',
    modifiedTimestamp = '2022-01-01T09:00:00',
  }: Partial<Visit> = {}): Visit =>
    ({
      applicationReference,
      reference,
      prisonerId,
      prisonId,
      sessionTemplateReference,
      visitRoom,
      visitType,
      visitStatus,
      outcomeStatus,
      visitRestriction,
      startTimestamp,
      endTimestamp,
      visitNotes,
      visitContact,
      visitors,
      visitorSupport,
      createdTimestamp,
      modifiedTimestamp,
    } as Visit)

  static visitHistoryDetails = ({
    eventsAudit = [
      {
        type: 'BOOKED_VISIT',
        applicationMethodType: 'NOT_KNOWN',
        actionedBy: 'User One',
        createTimestamp: '2022-01-01T09:00:00',
      },
      {
        type: 'UPDATED_VISIT',
        applicationMethodType: 'NOT_KNOWN',
        actionedBy: 'User Two',
        createTimestamp: '2022-01-01T10:00:00',
      },
    ],
    visit = this.visit(),
  }: Partial<VisitHistoryDetails> = {}): VisitHistoryDetails => ({
    eventsAudit,
    visit,
  })

  static visitSession = ({
    sessionTemplateReference = 'v9d.7ed.7u',
    visitRoom = 'Visit room 1',
    visitType = 'SOCIAL',
    prisonId = 'HEI',
    openVisitCapacity = 20,
    openVisitBookedCount = 2,
    closedVisitCapacity = 2,
    closedVisitBookedCount = 1,
    startTimestamp = '2022-01-14T10:00:00',
    endTimestamp = '2022-01-14T11:00:00',
    sessionConflicts = undefined,
  }: Partial<VisitSession> = {}): VisitSession => ({
    sessionTemplateReference,
    visitRoom,
    visitType,
    prisonId,
    openVisitCapacity,
    openVisitBookedCount,
    closedVisitCapacity,
    closedVisitBookedCount,
    startTimestamp,
    endTimestamp,
    sessionConflicts,
  })
}
