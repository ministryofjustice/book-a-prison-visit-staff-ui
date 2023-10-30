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
  // Aylesbury (HMYOI)
  AYI: {
    prisonPhoneNumber: '01296 444 302',
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
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
  // Coldingley (HMP)
  CLI: {
    prisonPhoneNumber: '0330 016 8787',
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and any number of children related to the prisoner.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Dartmoor (HMP)
  DAI: {
    prisonPhoneNumber: '01822 322 022',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
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
  // Downview (HMP & YOI)
  DWI: {
    prisonPhoneNumber: '0300 303 0633',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
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
  // Standford Hill (HMP & YOI)
  EHI: {
    prisonPhoneNumber: '0300 060 6603',
    selectVisitorsText: [
      'You can add up to 4 people aged 18 and over, and any number of children related to the prisoner.',
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
  // Featherstone (HMP)
  FSI: {
    prisonPhoneNumber: '0300 060 6502',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of approved children.',
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
  // Hull (HMP & YOI)
  HLI: {
    prisonPhoneNumber: '01482 282 016',
    selectVisitorsText: [
      'You can add up to 4 people aged 16 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Lancaster Farms (HMP)
  LFI: {
    prisonPhoneNumber: '01524 563 636',
    selectVisitorsText: [
      'You can add up to 3 people aged 10 and over, and 3 children under 10 years old.',
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
  // Moorland (HMP & YOI)
  MDI: {
    prisonPhoneNumber: '01302 523 289',
    selectVisitorsText: [
      'You can add up to a total of 5 people, with a maximum of 3 people aged 18 and over.',
      'At least one visitor must be 18 or older.',
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
  // The Mount (HMP)
  MTI: {
    prisonPhoneNumber: '01442 836 352',
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
  // North Sea Camp (HMP)
  NSI: {
    prisonPhoneNumber: '01205 769 368',
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Onley (HMP)
  ONI: {
    prisonPhoneNumber: '01788 523 402',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over with no more than 6 children per visit.',
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
  // Rochester (HMP & YOI)
  RCI: {
    prisonPhoneNumber: '0300 060 6513',
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Ranby (HMP)
  RNI: {
    prisonPhoneNumber: '01777 862 107',
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of children.',
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
  // Stafford (HMP)
  SFI: {
    prisonPhoneNumber: '0300 060 6505',
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
  // Swinfen Hall (HMP & YOI)
  SNI: {
    prisonPhoneNumber: '0300 060 6507',
    selectVisitorsText: [
      'You can add up to a total of 3 people.',
      'A total of 4 people can attend if one is under 5.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Styal (HMP & YOI)
  STI: {
    prisonPhoneNumber: '0300 060 6512',
    selectVisitorsText: [
      'You can add up to a total of 5 people, with a maximum of 3 people aged 18 and over.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Swansea (HMP & YOI)
  SWI: {
    prisonPhoneNumber: '01792 485 322',
    selectVisitorsText: [
      'You can add up to 3 people aged over 18, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Thorn Cross (HMP & YOI)
  TCI: {
    prisonPhoneNumber: '01925 805 018',
    selectVisitorsText: [
      'You can add up to 3 people aged over 18, and 5 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Wayland (HMP)
  WLI: {
    prisonPhoneNumber: '01953 804 152',
    selectVisitorsText: [
      'You can add up to 3 people aged over 18, and 4 children under 18 years old.',
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
