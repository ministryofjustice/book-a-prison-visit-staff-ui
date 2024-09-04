type PrisonConfiguration = {
  selectVisitorsText: string[]
}

const prisonConfiguration: Record<string, PrisonConfiguration> = {
  // Askham Grange
  AGI: {
    selectVisitorsText: [
      'You can add up to 4 people aged 18 and over, and 4 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Aylesbury
  AYI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Bedford
  BFI: {
    selectVisitorsText: [
      'You can add up to 2 people aged 18 and over, and 5 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Bristol
  BLI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over. Children can also be added to the visit.',
      'Contact HMP Bristol when the total number of visitors (adults and children) is more than 3.',
    ],
  },
  // Bullingdon
  BNI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Bure
  BRI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 5 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Brinsford
  BSI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 10 and over, and 3 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Chelmsford
  CDI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 8 and over, and 3 children under 8 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Cardiff
  CFI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Coldingley
  CLI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and any number of children related to the prisoner.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Dartmoor
  DAI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Drake Hall
  DHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 17 and over, and 4 children under 17 years old. ',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Durham
  DMI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 10 and over, and 3 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Downview
  DWI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Erlestoke
  EEI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Standford Hill
  EHI: {
    selectVisitorsText: [
      'You can add up to 4 people aged 18 and over, and any number of children related to the prisoner.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // East Sutton Park
  ESI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Eastwood Park
  EWI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Elmley
  EYI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Ford
  FDI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 5 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Foston Hall
  FHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Full Sutton
  FNI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Featherstone
  FSI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Guys Marsh
  GMI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Hollesley Bay
  HBI: {
    selectVisitorsText: [
      'You can add up to a total of 6 people, with a maximum of 3 people aged 18 and over.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Hewell
  HEI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 13 and over, and 3 children under 13 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Hull
  HLI: {
    selectVisitorsText: [
      'You can add up to 4 people aged 16 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Highpoint
  HPI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 4 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Kirkham
  KMI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Lancaster Farms
  LFI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 10 and over, and 3 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Lindholme
  LHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 6 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Lincoln
  LII: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 6 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Low Newton
  LNI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
      'Contact the establishment if you would like to bring more than 3 children.',
    ],
  },
  // Littlehey
  LTI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Lewes
  LWI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Moorland
  MDI: {
    selectVisitorsText: [
      'You can add up to a total of 5 people, with a maximum of 3 people aged 18 and over.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Morton Hall
  MHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Maidstone
  MSI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 12 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // The Mount
  MTI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // New Hall
  NHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Nottingham
  NMI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // North Sea Camp
  NSI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Norwich
  NWI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Onley
  ONI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over with no more than 6 children per visit.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Preston
  PNI: {
    selectVisitorsText: [
      'You can add up to a total of 5 people, with a maximum of 3 people aged 16 and over.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Pentonville
  PVI: {
    selectVisitorsText: [
      'You can add up to a total of 5 people, with a maximum of 3 people aged 18 and over.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Rochester
  RCI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Ranby
  RNI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Send
  SDI: {
    selectVisitorsText: ['You can add up to a total of 4 people.', 'At least one visitor must be 18 or older.'],
  },
  // Stafford
  SFI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Stoke Heath
  SHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Stocken
  SKI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over - with a maximum of 5 total visitors.',
      'At least one visitor must be 18 or older.',
      'Contact the establishment if you would like to bring more children.',
    ],
  },
  // Swinfen Hall
  SNI: {
    selectVisitorsText: [
      'You can add up to a total of 3 people.',
      'A total of 4 people can attend if one is under 5.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Sudbury
  SUI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 12 and over - with a maximum of 5 total visitors.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Styal
  STI: {
    selectVisitorsText: [
      'You can add up to a total of 5 people, with a maximum of 3 people aged 18 and over.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Swansea
  SWI: {
    selectVisitorsText: [
      'You can add up to 3 people aged over 18, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Thorn Cross
  TCI: {
    selectVisitorsText: [
      'You can add up to 3 people aged over 18, and 5 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Winchester
  WCI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 10 and over, and 3 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Warren Hill
  WII: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 5 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Wayland
  WLI: {
    selectVisitorsText: [
      'You can add up to 3 people aged over 18, and 4 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Werrington
  WNI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 15 and over, and 3 children under 15 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Whitemoor
  WRI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Wandsworth
  WWI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
}

const defaultConfiguration: PrisonConfiguration = {
  selectVisitorsText: [],
}

const getPrisonConfiguration = (prisonId: string): PrisonConfiguration => {
  return prisonConfiguration[prisonId] ?? defaultConfiguration
}

export default getPrisonConfiguration
