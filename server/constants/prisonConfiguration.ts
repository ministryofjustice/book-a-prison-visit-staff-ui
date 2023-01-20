type PrisonConfiguration = {
  prisonPhoneNumber: string
  selectVisitorsText: string[]
  visitCapacity: {
    open: number
    closed: number
  }
}

const prisonConfiguration: Record<string, PrisonConfiguration> = {
  BLI: {
    prisonPhoneNumber: '0300 060 6510',
    selectVisitorsText: [
      'Add up to 3 adults (aged 18 or older). Children can also be added to the visit.',
      'Contact HMP Bristol when the total number of visitors (adults and children) is more than 3.',
    ],
    visitCapacity: {
      open: 20,
      closed: 1,
    },
  },
  HEI: {
    prisonPhoneNumber: '0300 060 6503',
    selectVisitorsText: [
      'Add up to 3 people aged 10 and over, and 4 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
    visitCapacity: {
      open: 30,
      closed: 3,
    },
  },
}

const defaultConfiguration: PrisonConfiguration = {
  prisonPhoneNumber: '',
  selectVisitorsText: [],
  visitCapacity: {
    open: null,
    closed: null,
  },
}

const getPrisonConfiguration = (prisonId: string): PrisonConfiguration => {
  return prisonConfiguration[prisonId] ?? defaultConfiguration
}

export default getPrisonConfiguration
