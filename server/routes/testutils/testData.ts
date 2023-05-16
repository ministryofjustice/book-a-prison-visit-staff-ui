import { Prison } from '../../@types/bapv'
import {
  SessionCapacity,
  SessionSchedule,
  SupportType,
  Visit,
  VisitHistoryDetails,
  VisitSession,
} from '../../data/orchestrationApiTypes'
import {
  InmateDetail,
  CaseLoad,
  PrisonerBookingSummary,
  VisitBalances,
  OffenderRestriction,
  Alert,
} from '../../data/prisonApiTypes'
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
    alertId = 123,
    alertType = 'U',
    alertTypeDescription = 'COVID unit management',
    alertCode = 'UPIU',
    alertCodeDescription = 'Protective Isolation Unit',
    comment = 'Alert comment!',
    dateCreated = '2023-01-02',
    dateExpires = undefined,
    expired = false,
    active = true,
  }: Partial<Alert> = {}): Alert =>
    ({
      alertId,
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

  static inmateDetail = ({
    offenderNo = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    dateOfBirth = '1975-04-02',
    activeAlertCount = 0,
    inactiveAlertCount = 0,
    alerts = undefined,
    assignedLivingUnit = {
      description: '1-1-C-028',
      agencyName: 'Hewell (HMP)',
    } as InmateDetail['assignedLivingUnit'],
    category = 'Cat C',
    legalStatus = 'SENTENCED',
  }: Partial<InmateDetail> = {}): InmateDetail =>
    ({
      offenderNo,
      firstName,
      lastName,
      dateOfBirth,
      activeAlertCount,
      inactiveAlertCount,
      alerts,
      assignedLivingUnit,
      category,
      legalStatus,
    } as InmateDetail)

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

  static prisonerBookingSummary = ({
    bookingId = 12345,
    offenderNo = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    dateOfBirth = '1975-04-02',
    agencyId = 'HEI',
    legalStatus = 'SENTENCED',
    convictedStatus = 'Convicted',
  }: Partial<PrisonerBookingSummary> = {}): PrisonerBookingSummary =>
    ({
      bookingId,
      offenderNo,
      firstName,
      lastName,
      dateOfBirth,
      agencyId,
      legalStatus,
      convictedStatus,
    } as PrisonerBookingSummary)

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
    startTime = '13:45',
    endTime = '15:45',
    capacity = { closed: 0, open: 40 },
    prisonerLocationGroupNames = [],
    prisonerCategoryGroupNames = [],
    prisonerIncentiveLevelGroupNames = [],
    sessionTemplateFrequency = 'WEEKLY',
    sessionTemplateEndDate = '',
  }: Partial<SessionSchedule> = {}): SessionSchedule => ({
    sessionTemplateReference,
    startTime,
    endTime,
    capacity,
    prisonerLocationGroupNames,
    prisonerCategoryGroupNames,
    prisonerIncentiveLevelGroupNames,
    sessionTemplateFrequency,
    sessionTemplateEndDate,
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
      },
      {
        nomisPersonId: 4322,
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
    createdBy = 'user1',
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
      createdBy,
      createdTimestamp,
      modifiedTimestamp,
    } as Visit)

  static visitBalances = ({
    remainingVo = 2,
    remainingPvo = 1,
    latestIepAdjustDate = '2022-04-25',
    latestPrivIepAdjustDate = '2022-04-26',
  }: Partial<VisitBalances> = {}): VisitBalances => ({
    remainingVo,
    remainingPvo,
    latestIepAdjustDate,
    latestPrivIepAdjustDate,
  })

  static visitHistoryDetails = ({
    createdBy = 'User One',
    updatedBy = 'User Two',
    cancelledBy = undefined,
    createdDateAndTime = '2022-01-01T09:00:00',
    updatedDateAndTime = '2022-01-01T10:00:00',
    cancelledDateAndTime = undefined,
    visit = this.visit(),
  }: Partial<VisitHistoryDetails> = {}): VisitHistoryDetails => ({
    createdBy,
    updatedBy,
    cancelledBy,
    createdDateAndTime,
    updatedDateAndTime,
    cancelledDateAndTime,
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
