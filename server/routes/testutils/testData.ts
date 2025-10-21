import CaseLoad from '@ministryofjustice/hmpps-connect-dps-components/dist/types/CaseLoad'
import {
  Alert,
  ApplicationDto,
  BookerDetailedInfoDto,
  BookerSearchResultsDto,
  ExcludeDateDto,
  NotificationCount,
  OffenderRestriction,
  PrisonDto,
  PrisonerProfile,
  PrisonerScheduledEventDto,
  SessionCapacity,
  SessionsAndScheduleDto,
  SessionSchedule,
  Visit,
  VisitBookingDetails,
  VisitBookingDetailsRaw,
  VisitNotificationEvent,
  VisitNotificationEventRaw,
  VisitNotifications,
  VisitNotificationsRaw,
  VisitPreview,
  VisitRequestResponse,
  VisitRequestsCountDto,
  VisitRequestSummary,
  VisitSession,
  VisitSessionsAndScheduleDto,
  VisitSessionV2Dto,
  VisitSummary,
} from '../../data/orchestrationApiTypes'
import { CurrentIncentive, Prisoner } from '../../data/prisonerOffenderSearchTypes'
import { Address, Contact, Restriction } from '../../data/prisonerContactRegistryApiTypes'
import { MoJAlert, Prison } from '../../@types/bapv'

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
    startDate = '2023-01-02',
    expiryDate = null,
    updatedDate = '2023-03-01',
    active = true,
  }: Partial<Alert> = {}): Alert =>
    ({
      alertType,
      alertTypeDescription,
      alertCode,
      alertCodeDescription,
      comment,
      startDate,
      expiryDate,
      updatedDate,
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
    applicationStatus = 'IN_PROGRESS',
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
      applicationStatus,
    }) as ApplicationDto

  static bookerDetailedInfo = ({
    reference = 'aaaa-bbbb-cccc',
    email = 'booker@example.com',
    permittedPrisoners = [
      {
        prisoner: this.bookerPrisoner(),
        registeredPrison: this.bookerPrisonerRegisteredPrison(),
        permittedVisitors: [this.bookerPrisonerVisitor()],
      },
    ],
  }: Partial<BookerDetailedInfoDto> = {}): BookerDetailedInfoDto => ({ reference, email, permittedPrisoners })

  static bookerPrisoner = ({
    prisonerNumber = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    dateOfBirth = '1975-04-02',
    prisonId = 'HEI',
    prisonName = 'Hewell (HMP)',
    cellLocation = '1-1-C-028',
    locationDescription = 'Hewell (HMP)',
    convictedStatus = 'Convicted',
  }: Partial<
    BookerDetailedInfoDto['permittedPrisoners'][0]['prisoner']
  > = {}): BookerDetailedInfoDto['permittedPrisoners'][0]['prisoner'] => ({
    prisonerNumber,
    firstName,
    lastName,
    dateOfBirth,
    prisonId,
    prisonName,
    cellLocation,
    locationDescription,
    convictedStatus,
  })

  static bookerPrisonerRegisteredPrison = ({
    prisonCode = 'HEI',
    prisonName = 'Hewell (HMP)',
  }: Partial<
    BookerDetailedInfoDto['permittedPrisoners'][0]['registeredPrison']
  > = {}): BookerDetailedInfoDto['permittedPrisoners'][0]['registeredPrison'] => ({ prisonCode, prisonName })

  static bookerPrisonerVisitor = ({
    visitorId = 4321,
    firstName = 'Jeanette',
    lastName = 'Smith',
    dateOfBirth = '1986-07-28',
    relationshipDescription = 'Wife',
  }: Partial<
    BookerDetailedInfoDto['permittedPrisoners'][0]['permittedVisitors'][0]
  > = {}): BookerDetailedInfoDto['permittedPrisoners'][0]['permittedVisitors'][0] => ({
    visitorId,
    firstName,
    lastName,
    dateOfBirth,
    relationshipDescription,
  })

  static bookerSearchResult = ({
    reference = 'aaaa-bbbb-cccc',
    email = 'booker@example.com',
    createdTimestamp = '2025-10-09T12:00:00',
  }: Partial<BookerSearchResultsDto> = {}): BookerSearchResultsDto => ({ reference, email, createdTimestamp })

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

  static excludeDateDto = ({
    excludeDate = '2024-12-12',
    actionedBy = 'User one',
  }: Partial<ExcludeDateDto> = {}): ExcludeDateDto => ({
    excludeDate,
    actionedBy,
  })

  static mojAlert = ({
    variant = 'warning',
    title = 'Another person has booked the last table.',
    showTitleAsHeading = true,
    text = 'Select whether to book for this time or choose a new visit time.',
    html = undefined,
  }: Partial<MoJAlert> = {}): MoJAlert =>
    html
      ? {
          variant,
          title,
          showTitleAsHeading,
          html,
        }
      : {
          variant,
          title,
          showTitleAsHeading,
          text,
        }

  static notificationCount = ({ count = 5 }: Partial<NotificationCount> = {}): NotificationCount => ({ count })

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
    prisonerRestrictions = [],
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
      prisonerRestrictions,
      visitBalances,
      visits,
    }) as PrisonerProfile

  static prisonerScheduledEvent = ({
    eventType = 'PRISON_ACT',
    eventSubTypeDesc = 'Prison activities',
    eventSourceDesc = 'Educational activity',
    startTime = '10:00',
    endTime = '11:00',
  }: Partial<PrisonerScheduledEventDto> = {}): PrisonerScheduledEventDto => ({
    eventType,
    eventSubTypeDesc,
    eventSourceDesc,
    startTime,
    endTime,
  })

  // Visitor restrictions
  static restriction = ({
    restrictionId = 1,
    restrictionType = 'NONCON',
    restrictionTypeDescription = 'Non-Contact Visit',
    startDate = '2023-02-01',
    expiryDate = null,
    globalRestriction = true,
    comment = 'Restriction test comment',
  }: Partial<Restriction> = {}): Restriction => ({
    restrictionId,
    restrictionType,
    restrictionTypeDescription,
    startDate,
    expiryDate,
    globalRestriction,
    comment,
  })

  static sessionCapacity = ({ open = 30, closed = 3 }: Partial<SessionCapacity> = {}): SessionCapacity =>
    ({ open, closed }) as SessionCapacity

  static sessionsAndScheduleDto = ({
    date = '2022-01-14',
    visitSessions = [this.visitSessionV2()],
    scheduledEvents = [this.prisonerScheduledEvent()],
  }: Partial<SessionsAndScheduleDto> = {}): SessionsAndScheduleDto => ({
    date,
    visitSessions,
    scheduledEvents,
  })

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
    areCategoryGroupsInclusive = true,
    prisonerCategoryGroupNames = [],
    areIncentiveGroupsInclusive = true,
    prisonerIncentiveLevelGroupNames = [],
    weeklyFrequency = 1,
    visitType = 'SOCIAL',
    visitRoom = 'Visits hall',
  }: Partial<SessionSchedule> = {}): SessionSchedule => ({
    sessionTemplateReference,
    sessionTimeSlot,
    sessionDateRange,
    capacity,
    areLocationGroupsInclusive,
    prisonerLocationGroupNames,
    areCategoryGroupsInclusive,
    prisonerCategoryGroupNames,
    areIncentiveGroupsInclusive,
    prisonerIncentiveLevelGroupNames,
    weeklyFrequency,
    visitType,
    visitRoom,
  })

  static supportedPrisonIds = ({ prisonIds = ['HEI', 'BLI'] } = {}): string[] => prisonIds

  static prison = ({
    prisonId = this.prisonDto().code,
    prisonName = this.prisonDto().prisonName,
    active = this.prisonDto().active,
    policyNoticeDaysMax = this.prisonDto().policyNoticeDaysMax,
    policyNoticeDaysMin = this.prisonDto().policyNoticeDaysMin,
    maxTotalVisitors = this.prisonDto().maxTotalVisitors,
    maxAdultVisitors = this.prisonDto().maxAdultVisitors,
    maxChildVisitors = this.prisonDto().maxChildVisitors,
    adultAgeYears = this.prisonDto().adultAgeYears,
    clients = this.prisonDto().clients,
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
      clients,
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
    clients = [{ userType: 'STAFF', active: true }],
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
      clients,
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
      email: 'visitor@example.com',
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

  // data with event/notification types processed
  static visitBookingDetails = ({
    reference = 'ab-cd-ef-gh',
    visitRoom = 'Visit room 1',
    visitStatus = 'BOOKED',
    visitSubStatus = 'AUTO_APPROVED',
    outcomeStatus = null,
    visitRestriction = 'OPEN',
    startTimestamp = '2022-01-14T10:00:00',
    endTimestamp = '2022-01-14T11:00:00',
    sessionTemplateReference = 'v9d.7ed.7u',
    visitNotes = [],
    visitContact = {
      visitContactId: 4321,
      name: 'Jeanette Smith',
      telephone: '01234 567890',
      email: 'visitor@example.com',
    },
    visitorSupport = { description: 'Wheelchair ramp' },
    prison = {
      prisonId: 'HEI',
      prisonName: 'Hewell (HMP)',
    },
    prisoner = {
      prisonerNumber: 'A1234BC',
      firstName: 'JOHN',
      lastName: 'SMITH',
      dateOfBirth: '1975-04-02',
      prisonId: 'HEI',
      prisonName: 'Hewell (HMP)',
      cellLocation: '1-1-C-028',
      locationDescription: undefined,
      prisonerAlerts: [this.alert()],
      prisonerRestrictions: [this.offenderRestriction()],
    },
    visitors = [
      {
        personId: 4321,
        firstName: 'Jeanette',
        lastName: 'Smith',
        dateOfBirth: '1986-07-28',
        relationshipDescription: 'WIFE',
        restrictions: [
          {
            restrictionId: 1,
            restrictionType: 'CLOSED',
            restrictionTypeDescription: 'Closed',
            globalRestriction: false,
            startDate: '2022-01-11',
            expiryDate: '2023-02-13',
            comment: 'closed comment text',
          },
        ],
        primaryAddress: {
          street: '123 The Street',
          town: 'Coventry',
          primary: true,
          noFixedAddress: false,
          phones: [],
          addressUsages: [],
        },
      },
    ],
    events = [
      {
        type: 'BOOKED_VISIT',
        applicationMethodType: 'PHONE',
        actionedByFullName: 'User One',
        userType: 'STAFF',
        createTimestamp: '2022-01-01T09:00:00',
      },
    ],
    notifications = [],
  }: Partial<VisitBookingDetails> = {}): VisitBookingDetails => ({
    reference,
    visitRoom,
    visitStatus,
    visitSubStatus,
    outcomeStatus,
    visitRestriction,
    startTimestamp,
    endTimestamp,
    sessionTemplateReference,
    visitNotes,
    visitContact,
    visitorSupport,
    prison,
    prisoner,
    visitors,
    events,
    notifications,
  })

  // raw data as returned from API
  static visitBookingDetailsRaw = ({
    reference = this.visitBookingDetails().reference,
    visitRoom = this.visitBookingDetails().visitRoom,
    visitStatus = this.visitBookingDetails().visitStatus,
    visitSubStatus = this.visitBookingDetails().visitSubStatus,
    outcomeStatus = this.visitBookingDetails().outcomeStatus,
    visitRestriction = this.visitBookingDetails().visitRestriction,
    startTimestamp = this.visitBookingDetails().startTimestamp,
    endTimestamp = this.visitBookingDetails().endTimestamp,
    sessionTemplateReference = this.visitBookingDetails().sessionTemplateReference,
    visitNotes = this.visitBookingDetails().visitNotes,
    visitContact = this.visitBookingDetails().visitContact,
    visitorSupport = this.visitBookingDetails().visitorSupport,
    prison = this.visitBookingDetails().prison,
    prisoner = this.visitBookingDetails().prisoner,
    visitors = this.visitBookingDetails().visitors,
    events = this.visitBookingDetails().events as VisitBookingDetailsRaw['events'],
    notifications = this.visitBookingDetails().notifications as VisitBookingDetailsRaw['notifications'],
  }: Partial<VisitBookingDetailsRaw> = {}): VisitBookingDetailsRaw => ({
    reference,
    visitRoom,
    visitStatus,
    visitSubStatus,
    outcomeStatus,
    visitRestriction,
    startTimestamp,
    endTimestamp,
    sessionTemplateReference,
    visitNotes,
    visitContact,
    visitorSupport,
    prison,
    prisoner,
    visitors,
    events,
    notifications,
  })

  // data with notification types processed
  static visitNotificationEvent = ({
    type = 'VISITOR_RESTRICTION',
    notificationEventReference = 'qr*ub*ze*sb',
    createdDateTime = '2025-06-02T17:30:00',
    additionalData = [
      { attributeName: 'VISITOR_ID', attributeValue: '4321' },
      { attributeName: 'VISITOR_RESTRICTION', attributeValue: 'PREINF' },
      { attributeName: 'VISITOR_RESTRICTION_ID', attributeValue: '1' },
    ],
  }: Partial<VisitNotificationEvent> = {}): VisitNotificationEvent => ({
    type,
    notificationEventReference,
    createdDateTime,
    additionalData,
  })

  // raw data with types as returned from API
  static visitNotificationEventRaw = ({
    type = 'VISITOR_RESTRICTION_UPSERTED_EVENT',
    notificationEventReference = this.visitNotificationEvent().notificationEventReference,
    createdDateTime = this.visitNotificationEvent().createdDateTime,
    additionalData = this.visitNotificationEvent().additionalData,
  }: Partial<VisitNotificationEventRaw> = {}): VisitNotificationEventRaw => ({
    type,
    notificationEventReference,
    createdDateTime,
    additionalData,
  })

  // data with notification types processed
  static visitNotifications = ({
    visitReference = 'ab-cd-ef-gh',
    prisonerNumber = 'A1234BC',
    bookedByUserName = 'user1',
    bookedByName = 'User One',
    visitDate = '2025-07-01',
    notifications = [this.visitNotificationEvent()],
  }: Partial<VisitNotifications> = {}): VisitNotifications => ({
    visitReference,
    prisonerNumber,
    bookedByUserName,
    bookedByName,
    visitDate,
    notifications,
  })

  // raw data with types as returned from API
  static visitNotificationsRaw = ({
    visitReference = this.visitNotifications().visitReference,
    prisonerNumber = this.visitNotifications().prisonerNumber,
    bookedByUserName = this.visitNotifications().bookedByUserName,
    bookedByName = this.visitNotifications().bookedByName,
    visitDate = this.visitNotifications().visitDate,
    notifications = [this.visitNotificationEventRaw()],
  }: Partial<VisitNotificationsRaw> = {}): VisitNotificationsRaw => ({
    visitReference,
    prisonerNumber,
    bookedByUserName,
    bookedByName,
    visitDate,
    notifications,
  })

  static visitPreview = ({
    prisonerId = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    visitReference = 'ab-cd-ef-gh',
    visitorCount = 2,
    visitTimeSlot = { startTime: '13:45', endTime: '15:45' },
    firstBookedDateTime = '2022-01-01T09:00:00',
    visitRestriction = 'OPEN',
    visitStatus = 'BOOKED',
    visitSubStatus = 'APPROVED',
  }: Partial<VisitPreview> = {}): VisitPreview => ({
    prisonerId,
    firstName,
    lastName,
    visitReference,
    visitorCount,
    visitTimeSlot,
    firstBookedDateTime,
    visitRestriction,
    visitStatus,
    visitSubStatus,
  })

  static visitRequestResponse = ({
    visitReference = 'ab-cd-ef-gh',
    prisonerFirstName = 'JOHN',
    prisonerLastName = 'SMITH',
  }: Partial<VisitRequestResponse> = {}): VisitRequestResponse => ({
    visitReference,
    prisonerFirstName,
    prisonerLastName,
  })

  static visitRequestCount = ({ count = 3 }: Partial<VisitRequestsCountDto> = {}): VisitRequestsCountDto => ({ count })

  static visitRequestSummary = ({
    visitReference = 'ab-cd-ef-gh',
    visitDate = '2025-07-10',
    requestedOnDate = '2025-07-01',
    prisonerFirstName = 'JOHN',
    prisonerLastName = 'SMITH',
    prisonNumber = 'A1234BC',
    mainContact = 'Jeanette Smith',
  }: Partial<VisitRequestSummary> = {}): VisitRequestSummary => ({
    visitReference,
    visitDate,
    requestedOnDate,
    prisonerFirstName,
    prisonerLastName,
    prisonNumber,
    mainContact,
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

  static visitSessionV2 = ({
    sessionTemplateReference = 'v9d.7ed.7u',
    visitRoom = 'Visit room 1',
    openVisitCapacity = 20,
    openVisitBookedCount = 2,
    closedVisitCapacity = 2,
    closedVisitBookedCount = 1,
    startTime = '10:00',
    endTime = '11:00',
    sessionConflicts = [],
  }: Partial<VisitSessionV2Dto> = {}): VisitSessionV2Dto => ({
    sessionTemplateReference,
    visitRoom,
    openVisitCapacity,
    openVisitBookedCount,
    closedVisitCapacity,
    closedVisitBookedCount,
    startTime,
    endTime,
    sessionConflicts,
  })

  static visitSessionsAndSchedule = ({
    scheduledEventsAvailable = true,
    sessionsAndSchedule = [this.sessionsAndScheduleDto()],
  }: Partial<VisitSessionsAndScheduleDto> = {}): VisitSessionsAndScheduleDto => ({
    scheduledEventsAvailable,
    sessionsAndSchedule,
  })

  static visitSummary = ({
    reference = 'ab-cd-ef-gh',
    prisonerId = 'A1234BC',
    prisonId = 'HEI',
    prisonName = 'Hewell (HMP)',
    visitType = 'SOCIAL',
    visitStatus = 'BOOKED',
    visitSubStatus = 'APPROVED',
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
      visitSubStatus,
      visitRestriction,
      startTimestamp,
      endTimestamp,
      visitors,
    }) as VisitSummary
}
