type PrisonConfiguration = {
  prisonPhoneNumber: string
  selectVisitorsText: string[]
}

const prisonConfiguration: Record<string, PrisonConfiguration> = {
  // Askham Grange (HMP & YOI)
  AGI: {
    prisonPhoneNumber: '0300 060 6513',
    selectVisitorsText: [
      'You can add up to 4 people aged 18 and over, and 4 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Bristol (HMP & YOI)
  BLI: {
    prisonPhoneNumber: '0300 060 6510',
    selectVisitorsText: [
      'Add up to 3 adults (aged 18 or older). Children can also be added to the visit.',
      'Contact HMP Bristol when the total number of visitors (adults and children) is more than 3.',
    ],
  },
  // Bullingdon (HMP & YOI)
  BNI: {
    prisonPhoneNumber: '01869 353 176',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old. ',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Brinsford (HMP & YOI)
  BSI: {
    prisonPhoneNumber: '0300 060 6500',
    selectVisitorsText: [
      'You can add up to 3 people aged 10 and over, and 3 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Cardiff (HMP & YOI)
  CFI: {
    prisonPhoneNumber: '0300 303 2301',
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Drake Hall (HMP & YOI)
  DHI: {
    prisonPhoneNumber: '0300 060 6501',
    selectVisitorsText: [
      'You can add up to 3 people aged 17 and over, and 4 children under 17 years old. ',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Durham (HMP & YOI)
  DMI: {
    prisonPhoneNumber: '0300 303 2300',
    selectVisitorsText: [
      'You can add up to 3 people aged 12 and over, and 3 children under 12 years old.',
      'At least one visitor must be 18 or older.',
      'Contact HMP Durham if you would like to bring more than 3 children.',
    ],
  },
  // Erlestoke (HMP & YOI)
  EEI: {
    prisonPhoneNumber: '0300 303 0634',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // East Sutton Park (HMP & YOI)
  ESI: {
    prisonPhoneNumber: '0300 060 6513',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Eastwood Park (HMP & YOI)
  EWI: {
    prisonPhoneNumber: '0300 303 0631',
    selectVisitorsText: ['You can add up to 3 people.', 'At least one visitor must be 18 or older.'],
  },
  // Foston Hall (HMP & YOI)
  FHI: {
    prisonPhoneNumber: '0300 060 6516',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Full Sutton (HMP)
  FNI: {
    prisonPhoneNumber: '01759 475 355',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Hewell (HMP)
  HEI: {
    prisonPhoneNumber: '0300 060 6503',
    selectVisitorsText: [
      'Add up to 3 people aged 10 and over, and 4 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Low Newton (HMP & YOI)
  LNI: {
    prisonPhoneNumber: '0300 303 0632',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
      'Contact the establishment if you would like to bring more than 3 children.',
    ],
  },
  // Morton Hall (HMP)
  MHI: {
    prisonPhoneNumber: '0300 303 0649',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // New Hall (HMP & YOI)
  NHI: {
    prisonPhoneNumber: '0300 060 6515',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Preston (HMP & YOI)
  PNI: {
    prisonPhoneNumber: '0330 058 8224',
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Send (HMP)
  SDI: {
    prisonPhoneNumber: '0300 060 6514',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Stoke Heath (HMP & YOI)
  SHI: {
    prisonPhoneNumber: '0300 060 6506',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Werrington (HMYOI)
  WNI: {
    prisonPhoneNumber: '0300 060 6508',
    selectVisitorsText: [
      'You can add up to 3 people aged 15 and over, and 2 children under 15 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Wandsworth (HMP & YOI)
  WWI: {
    prisonPhoneNumber: '0300 060 6509',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
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
