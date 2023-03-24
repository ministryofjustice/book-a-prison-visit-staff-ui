type PrisonConfiguration = {
  prisonPhoneNumber: string
  selectVisitorsText: string[]
}

const prisonConfiguration: Record<string, PrisonConfiguration> = {
  BLI: {
    prisonPhoneNumber: '0300 060 6510',
    selectVisitorsText: [
      'Add up to 3 adults (aged 18 or older). Children can also be added to the visit.',
      'Contact HMP Bristol when the total number of visitors (adults and children) is more than 3.',
    ],
  },
  HEI: {
    prisonPhoneNumber: '0300 060 6503',
    selectVisitorsText: [
      'Add up to 3 people aged 10 and over, and 4 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  CFI: {
    prisonPhoneNumber: '0300 303 2301',
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  PNI: {
    prisonPhoneNumber: '0300 058 8224',
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  WWI: {
    prisonPhoneNumber: '0300 060 6509',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  DHI: {
    prisonPhoneNumber: '0300 060 6501',
    selectVisitorsText: [
      'You can add up to 3 people aged 17 and over, and 4 children under 17 years old. ',
      'At least one visitor must be 18 or older.',
    ],
  },
  EWI: {
    prisonPhoneNumber: '0300 303 0631',
    selectVisitorsText: ['You can add up to 3 people.', 'At least one visitor must be 18 or older.'],
  },
  MHI: {
    prisonPhoneNumber: '0300 303 0649',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old. ',
      'At least one visitor must be 18 or older.',
    ],
  },
  BNI: {
    prisonPhoneNumber: '01869 353 176',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old. ',
      'At least one visitor must be 18 or older.',
    ],
  },
}

const defaultConfiguration: PrisonConfiguration = {
  prisonPhoneNumber: '',
  selectVisitorsText: [],
}

const getPrisonConfiguration = (prisonId: string): PrisonConfiguration => {
  return prisonConfiguration[prisonId] ?? defaultConfiguration
}

export default getPrisonConfiguration
