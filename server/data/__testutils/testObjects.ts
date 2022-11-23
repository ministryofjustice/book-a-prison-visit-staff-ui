import { Prison } from '../../@types/bapv'

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
