import TestData from '../testutils/testData'
import { buildVisitPass, VisitPass } from './visitPassBuilder'

describe('visitPassBuilder', () => {
  beforeEach(() => {
    const fakeDate = new Date('2022-01-01')
    jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('buildVisitPass', () => {
    it('should map VisitPassDto to VisitPass formatted for display', () => {
      const visitPassDto = TestData.visitPassDto({
        visitors: [
          TestData.visitPassDtoVisitor(), // adult
          TestData.visitPassDtoVisitor({ firstName: 'Bob', dateOfBirth: '2010-01-01' }), // child
        ],
      })
      const visitPass = buildVisitPass(visitPassDto)

      expect(visitPass).toStrictEqual<VisitPass>({
        date: 'Monday 1 June 2026',
        time: '10am to 11am',
        prisonerName: 'John Smith',
        prisonNumber: 'A1234BC',
        reference: 'ab-cd-ef-gh',
        type: 'Open',
        adults: [
          {
            name: 'Jeanette Smith',
            address: '23B, Premises, 123 The Street, Coventry, C1 2AB',
          },
        ],
        children: [
          {
            name: 'Bob Smith',
            dateOfBirth: '2010-01-01',
          },
        ],
      })
    })

    it('should classify a visitor with no date of birth as an adult', () => {
      const visitPassDto = TestData.visitPassDto({
        visitors: [TestData.visitPassDtoVisitor({ dateOfBirth: null })],
      })

      const visitPass = buildVisitPass(visitPassDto)

      expect(visitPass.adults).toHaveLength(1)
      expect(visitPass.children).toHaveLength(0)
    })

    it('should classify a visitor aged 16 exactly as an adult', () => {
      const visitPassDto = TestData.visitPassDto({
        visitors: [TestData.visitPassDtoVisitor({ dateOfBirth: '2006-01-01' })],
      })

      const visitPass = buildVisitPass(visitPassDto)

      expect(visitPass.adults).toHaveLength(1)
      expect(visitPass.children).toHaveLength(0)
    })

    it('should classify a visitor aged under 16 as a child', () => {
      const visitPassDto = TestData.visitPassDto({
        visitors: [TestData.visitPassDtoVisitor({ dateOfBirth: '2006-01-02' })],
      })

      const visitPass = buildVisitPass(visitPassDto)

      expect(visitPass.adults).toHaveLength(0)
      expect(visitPass.children).toHaveLength(1)
    })
  })
})
