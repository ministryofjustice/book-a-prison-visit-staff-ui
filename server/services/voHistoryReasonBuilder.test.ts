import TestData from '../routes/testutils/testData'
import voHistoryReasonBuilder from './voHistoryReasonBuilder'

describe('voHistoryReasonBuilder - Build VO history page reason HTML', () => {
  it('should return correct content for "VO_ALLOCATION"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({ visitOrderHistoryType: 'VO_ALLOCATION' })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('VO allocation (Standard incentive level)')
  })
  it('should return correct content for "PVO_ALLOCATION"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({ visitOrderHistoryType: 'PVO_ALLOCATION' })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('PVO allocation (Standard incentive level)')
  })
  it('should return correct content for "PVO_ALLOCATION"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({ visitOrderHistoryType: 'VO_AND_PVO_ALLOCATION' })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('VO and PVO allocation (Standard incentive level)')
  })
  it('should return correct content for "VO_EXPIRATION"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({ visitOrderHistoryType: 'VO_EXPIRATION' })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('VO expired')
  })
  it('should return correct content for "PVO_EXPIRATION"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({ visitOrderHistoryType: 'PVO_EXPIRATION' })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('PVO expired')
  })
  it('should return correct content for "VO_AND_PVO_EXPIRATION"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({ visitOrderHistoryType: 'VO_AND_PVO_EXPIRATION' })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('VO and PVO expired')
  })
  it('should return correct content for "MIGRATION"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({ visitOrderHistoryType: 'MIGRATION' })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('Balance transferred from previous prison by user1')
  })
  it('should return correct content for "ALLOCATION_USED_BY_VISIT"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({
      visitOrderHistoryType: 'ALLOCATION_USED_BY_VISIT',
    })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual(`<a href="/visit/ab-cd-ef-gh">Visit ab-cd-ef-gh</a> booked for X visit date`)
  })
  it('should return correct content for "ALLOCATION_REFUNDED_BY_VISIT_CANCELLED"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({
      visitOrderHistoryType: 'ALLOCATION_REFUNDED_BY_VISIT_CANCELLED',
    })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual(`<a href="/visit/ab-cd-ef-gh">Visit ab-cd-ef-gh</a> cancelled for X visit date`)
  })
  it('should return correct content for "ADMIN_RESET_NEGATIVE_BALANCE"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({
      visitOrderHistoryType: 'ADMIN_RESET_NEGATIVE_BALANCE',
    })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('Admin reset')
  })
  it('should return correct content for "SYNC_FROM_NOMIS"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({
      visitOrderHistoryType: 'SYNC_FROM_NOMIS',
    })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('Sync from NOMIS')
  })
  it('should return correct content for "PRISONER_BALANCE_RESET"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({
      visitOrderHistoryType: 'PRISONER_BALANCE_RESET',
    })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('Prisoner balance reset')
  })
  it('should return correct content for "VO_ACCUMULATION"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({
      visitOrderHistoryType: 'VO_ACCUMULATION',
    })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('VO accumulation')
  })
  it('should return correct content for "ALLOCATION_ADDED_AFTER_PRISONER_MERGE"', () => {
    const visitOrderHistory = TestData.visitOrderHistoryDto({
      visitOrderHistoryType: 'ALLOCATION_ADDED_AFTER_PRISONER_MERGE',
    })
    const output = voHistoryReasonBuilder({ visitOrderHistory })
    expect(output).toStrictEqual('Allocation added after prisoner merge')
  })
})
