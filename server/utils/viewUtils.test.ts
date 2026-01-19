import ViewUtils from './viewUtils'

describe('ViewUtils', () => {
  describe('escape', () => {
    it('should escape HTML characters', () => {
      expect(ViewUtils.escape('Escape <this> & "that" !')).toBe('Escape &lt;this&gt; &amp; &quot;that&quot; !')
    })
  })
})
