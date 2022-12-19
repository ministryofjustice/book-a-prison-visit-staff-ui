import { Prison } from '../../@types/bapv'
import { CaseLoad } from '../prisonApiTypes'

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
