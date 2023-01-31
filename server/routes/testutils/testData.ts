import { Prison } from '../../@types/bapv'
import { SessionCapacity, SupportType, Visit } from '../../data/visitSchedulerApiTypes'
import { InmateDetail, CaseLoad, PrisonerBookingSummary } from '../../data/prisonApiTypes'
import { CurrentIncentive, Prisoner } from '../../data/prisonerOffenderSearchTypes'

export default class TestData {
  static currentIncentive = ({
    level = {
      code: 'STD',
      description: 'Standard',
    },
  }: Partial<CurrentIncentive> = {}): CurrentIncentive => ({ level } as CurrentIncentive)

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

  static inmateDetail = ({
    offenderNo = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    dateOfBirth = '1975-04-02',
    activeAlertCount = undefined,
    inactiveAlertCount = undefined,
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

  static sessionCapacity = ({ open = 30, closed = 3 }: Partial<SessionCapacity> = {}): SessionCapacity =>
    ({ open, closed } as SessionCapacity)

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
    visitRoom = 'A1 L3',
    visitType = 'SOCIAL',
    visitStatus = 'BOOKED',
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
        nomisPersonId: 4324,
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
    createdTimestamp,
    modifiedTimestamp,
  }: Partial<Visit> = {}): Visit =>
    ({
      applicationReference,
      reference,
      prisonerId,
      prisonId,
      visitRoom,
      visitType,
      visitStatus,
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
}
