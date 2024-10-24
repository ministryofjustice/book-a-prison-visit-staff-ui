import CaseLoad from '@ministryofjustice/hmpps-connect-dps-components/dist/types/CaseLoad'
import {
  Alert,
  ApplicationDto,
  NotificationCount,
  NotificationGroup,
  NotificationVisitInfo,
  PrisonDto,
  PrisonerProfile,
  PrisonExcludeDateDto,
  SessionCapacity,
  SessionSchedule,
  Visit,
  VisitHistoryDetails,
  VisitPreview,
  VisitSession,
  VisitSummary,
} from '../../data/orchestrationApiTypes'
import { OffenderRestriction } from '../../data/prisonApiTypes'
import { CurrentIncentive, Prisoner } from '../../data/prisonerOffenderSearchTypes'
import { Address, Contact, Restriction } from '../../data/prisonerContactRegistryApiTypes'
import { ScheduledEvent } from '../../data/whereaboutsApiTypes'
import { PrisonName } from '../../data/prisonRegisterApiTypes'
import { Prison } from '../../@types/bapv'

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
    }) as Address

  static alert = ({
    alertType = 'U',
    alertTypeDescription = 'COVID unit management',
    alertCode = 'UPIU',
    alertCodeDescription = 'Protective Isolation Unit',
    comment = 'Alert comment',
    dateCreated = '2023-01-02',
    dateExpires = undefined,
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
      active,
    }) as Alert

  static application = ({
    reference = 'aaa-bbb-ccc',
    sessionTemplateReference = 'v9d.7ed.7u',
    prisonerId = 'A1234BC',
    prisonId = 'HEI',
    visitType = 'SOCIAL',
    visitRestriction = 'OPEN',
    startTimestamp = '2022-01-14T10:00:00',
    endTimestamp = '2022-01-14T11:00:00',
    visitNotes = [],
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
    visitorSupport = { description: '' },
    createdTimestamp = '2022-01-01T09:00:00',
    modifiedTimestamp = '2022-01-01T09:00:00',
    reserved = true,
    completed = false,
  }: Partial<ApplicationDto> = {}): ApplicationDto =>
    ({
      reference,
      sessionTemplateReference,
      prisonerId,
      prisonId,
      visitType,
      visitRestriction,
      startTimestamp,
      endTimestamp,
      visitNotes,
      visitContact,
      visitors,
      visitorSupport,
      createdTimestamp,
      modifiedTimestamp,
      reserved,
      completed,
    }) as ApplicationDto

  static caseLoad = ({
    caseLoadId = 'HEI',
    description = 'Hewell (HMP)',
    type = 'INST',
    caseloadFunction = 'GENERAL',
    currentlyActive = true,
  }: Partial<CaseLoad> = {}): CaseLoad => ({ caseLoadId, description, type, caseloadFunction, currentlyActive })

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
    }) as Contact

  static currentIncentive = ({
    level = {
      code: 'STD',
      description: 'Standard',
    },
  }: Partial<CurrentIncentive> = {}): CurrentIncentive => ({ level }) as CurrentIncentive

  static notificationCount = ({ count = 5 }: Partial<NotificationCount> = {}): NotificationCount => ({ count })

  static notificationGroup = ({
    reference = 'ab*cd*ef*gh',
    type = 'NON_ASSOCIATION_EVENT',
    affectedVisits = [
      this.notificationVisitInfo(),
      this.notificationVisitInfo({ bookedByName: 'User Two', bookedByUserName: 'user2', prisonerNumber: 'A5678DE' }),
    ],
  }: Partial<NotificationGroup> = {}): NotificationGroup => ({ reference, type, affectedVisits })

  static notificationVisitInfo = ({
    bookedByName = 'User One',
    bookedByUserName = 'user1',
    bookingReference = 'ab-cd-ef-gh',
    prisonerNumber = 'A1234BC',
    visitDate = '2023-11-01',
  }: Partial<NotificationVisitInfo> = {}): NotificationVisitInfo => ({
    bookedByName,
    bookedByUserName,
    bookingReference,
    prisonerNumber,
    visitDate,
  })

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

  static prisonExcludeDateDto = ({
    excludeDate = '2024-12-12',
    actionedBy = 'User one',
  }: Partial<PrisonExcludeDateDto> = {}): PrisonExcludeDateDto => ({
    excludeDate,
    actionedBy,
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
    locationDescription = undefined,
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
      locationDescription,
    }) as Prisoner

  static prisonNames = ({
    prisons = [
      {
        prisonId: 'HEI',
        prisonName: 'Hewell (HMP)',
      },
      {
        prisonId: 'BLI',
        prisonName: 'Bristol (HMP & YOI)',
      },
    ] as PrisonName[],
  } = {}): PrisonName[] => prisons

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
    }) as PrisonerProfile

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
    ({ open, closed }) as SessionCapacity

  static sessionSchedule = ({
    sessionTemplateReference = '-afe.dcc.0f',
    sessionTimeSlot = {
      startTime: '13:45',
      endTime: '15:45',
    },
    sessionDateRange = {
      validFromDate: '2023-02-01',
      validToDate: undefined,
    },
    capacity = { closed: 0, open: 40 },
    areLocationGroupsInclusive = true,
    prisonerLocationGroupNames = [],
    prisonerCategoryGroupNames = [],
    prisonerIncentiveLevelGroupNames = [],
    weeklyFrequency = 1,
    visitType = 'SOCIAL',
  }: Partial<SessionSchedule> = {}): SessionSchedule => ({
    sessionTemplateReference,
    sessionTimeSlot,
    sessionDateRange,
    capacity,
    areLocationGroupsInclusive,
    prisonerLocationGroupNames,
    prisonerCategoryGroupNames,
    prisonerIncentiveLevelGroupNames,
    weeklyFrequency,
    visitType,
  })

  static supportedPrisons = ({
    prisons = <Record<string, string>>{
      HEI: 'Hewell (HMP)',
      BLI: 'Bristol (HMP & YOI)',
    },
  } = {}): Record<string, string> => prisons

  static supportedPrisonIds = ({ prisonIds = ['HEI', 'BLI'] } = {}): string[] => prisonIds

  static prison = ({
    prisonId = 'HEI',
    prisonName = 'Hewell (HMP)',
    active = true,
    policyNoticeDaysMax = 28,
    policyNoticeDaysMin = 2,
    maxTotalVisitors = 6,
    maxAdultVisitors = 3,
    maxChildVisitors = 4,
    adultAgeYears = 18,
  }: Partial<Prison> = {}): Prison =>
    ({
      prisonId,
      prisonName,
      active,
      policyNoticeDaysMax,
      policyNoticeDaysMin,
      maxTotalVisitors,
      maxAdultVisitors,
      maxChildVisitors,
      adultAgeYears,
    }) as Prison

  static prisonDto = ({
    code = 'HEI',
    prisonName = 'Hewell (HMP)',
    active = true,
    policyNoticeDaysMax = 28,
    policyNoticeDaysMin = 2,
    maxTotalVisitors = 6,
    maxAdultVisitors = 3,
    maxChildVisitors = 4,
    adultAgeYears = 18,
  }: Partial<PrisonDto> = {}): PrisonDto =>
    ({
      code,
      prisonName,
      active,
      policyNoticeDaysMax,
      policyNoticeDaysMin,
      maxTotalVisitors,
      maxAdultVisitors,
      maxChildVisitors,
      adultAgeYears,
    }) as PrisonDto

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
    visitorSupport = { description: 'Wheelchair ramp, Portable induction loop for people with hearing aids' },
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
    }) as Visit

  static visitHistoryDetails = ({
    eventsAudit = [
      {
        type: 'BOOKED_VISIT',
        applicationMethodType: 'PHONE',
        actionedByFullName: 'User One',
        userType: 'STAFF',
        createTimestamp: '2022-01-01T09:00:00',
      },
      {
        type: 'UPDATED_VISIT',
        applicationMethodType: 'EMAIL',
        actionedByFullName: 'User Two',
        userType: 'STAFF',
        createTimestamp: '2022-01-01T10:00:00',
      },
      {
        type: 'NON_ASSOCIATION_EVENT',
        applicationMethodType: 'NOT_APPLICABLE',
        actionedByFullName: '',
        userType: 'SYSTEM',
        createTimestamp: '2022-01-01T11:00:00',
      },
    ],
    visit = this.visit(),
  }: Partial<VisitHistoryDetails> = {}): VisitHistoryDetails => ({
    eventsAudit,
    visit,
  })

  static visitPreview = ({
    prisonerId = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    visitReference = 'ab-cd-ef-gh',
    visitorCount = 2,
    visitTimeSlot = { startTime: '13:45', endTime: '15:45' },
  }: Partial<VisitPreview> = {}): VisitPreview => ({
    prisonerId,
    firstName,
    lastName,
    visitReference,
    visitorCount,
    visitTimeSlot,
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

  static visitSummary = ({
    reference = 'ab-cd-ef-gh',
    prisonerId = 'A1234BC',
    prisonId = 'HEI',
    prisonName = 'Hewell (HMP)',
    visitType = 'SOCIAL',
    visitStatus = 'BOOKED',
    visitRestriction = 'OPEN',
    startTimestamp = '2022-01-14T10:00:00',
    endTimestamp = '2022-01-14T11:00:00',
    visitors = [
      {
        nomisPersonId: 4321,
        firstName: 'Jeanette',
        lastName: 'Smith',
      },
    ],
  }: Partial<VisitSummary> = {}): VisitSummary =>
    ({
      reference,
      prisonerId,
      prisonId,
      prisonName,
      visitType,
      visitStatus,
      visitRestriction,
      startTimestamp,
      endTimestamp,
      visitors,
    }) as VisitSummary
}
