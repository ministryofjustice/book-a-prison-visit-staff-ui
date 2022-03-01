const items: Record<string, { key: string; label: string }> = {
  WHEELCHAIR: {
    key: 'wheelchair',
    label: 'Wheelchair ramp',
  },
  INDUCTION_LOOP: {
    key: 'inductionLoop',
    label: 'Portable induction loop for people with hearing aids',
  },
  BSL_INTERPRETER: {
    key: 'bslInterpreter',
    label: 'British Sign Language (BSL) Interpreter',
  },
  MASK_EXEMPT: {
    key: 'maskExempt',
    label: 'Face covering exemption',
  },
  OTHER: {
    key: 'other',
    label: 'Other',
  },
} as const

const getKeys = (): string[] => {
  return Object.keys(items).map(key => items[key].key)
}

const getValue = (key: string): string | undefined => {
  return Object.values(items).find(e => {
    return e.key === key
  })?.label
}

export default { items, getKeys, getValue }
