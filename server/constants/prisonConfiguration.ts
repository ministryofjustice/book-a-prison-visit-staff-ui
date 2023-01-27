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
  CFI: {
    prisonPhoneNumber: '0300 303 2301',
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
    visitCapacity: {
      open: 35,
      closed: 2,
    },
  },
  PNI: {
    prisonPhoneNumber: '0300 058 8224',
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
    visitCapacity: {
      open: 32,
      closed: 8,
    },
  },
  WWI: {
    prisonPhoneNumber: '0300 060 6509',
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
    visitCapacity: {
      open: 28,
      closed: 2,
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
