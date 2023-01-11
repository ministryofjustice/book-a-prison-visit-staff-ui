import { Prison } from '../../@types/bapv'
import { SupportType } from '../visitSchedulerApiTypes'
import { InmateDetail, CaseLoad } from '../prisonApiTypes'
import { CurrentIncentive, Prisoner } from '../prisonerOffenderSearchTypes'

export const createCaseLoads = ({
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

export const createCurrentIncentive = ({
  level = {
    code: 'STD',
    description: 'Standard',
  },
}: Partial<CurrentIncentive> = {}): CurrentIncentive => ({ level } as CurrentIncentive)

export const createInmateDetail = ({
  offenderNo = 'A1234BC',
  firstName = 'JOHN',
  lastName = 'SMITH',
  dateOfBirth = '1980-10-12',
  activeAlertCount = 1,
  inactiveAlertCount = 3,
  legalStatus = 'SENTENCED',
}: Partial<InmateDetail> = {}): InmateDetail =>
  ({
    offenderNo,
    firstName,
    lastName,
    dateOfBirth,
    activeAlertCount,
    inactiveAlertCount,
    legalStatus,
  } as InmateDetail)

export const createPrisoner = ({
  prisonerNumber = 'A1234BC',
  firstName = 'JOHN',
  lastName = 'SMITH',
  dateOfBirth = '1975-04-02',
  prisonId = 'HEI',
  prisonName = 'HMP Hewell',
  cellLocation = '1-1-C-028',
  currentIncentive = createCurrentIncentive(),
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

export const createPrisons = ({
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

export const createSupportedPrisons = ({
  prisons = <Record<string, string>>{
    HEI: 'Hewell (HMP)',
    BLI: 'Bristol (HMP & YOI)',
  },
} = {}): Record<string, string> => prisons

export const createSupportedPrisonIds = ({ prisonIds = ['HEI', 'BLI'] } = {}): string[] => prisonIds

export const createSupportTypes = ({
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
