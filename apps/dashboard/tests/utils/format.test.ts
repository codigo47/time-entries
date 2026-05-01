import { describe, it, expect } from 'vitest'
import { formatDateMDY } from '@/utils/format'

describe('formatDateMDY', () => {
  it('formats a valid ISO date to mm/dd/yyyy', () => {
    expect(formatDateMDY('2026-05-01')).toBe('05/01/2026')
  })

  it('formats another valid date', () => {
    expect(formatDateMDY('2025-12-31')).toBe('12/31/2025')
  })

  it('returns empty string for null', () => {
    expect(formatDateMDY(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatDateMDY(undefined)).toBe('')
  })

  it('returns the original string when only one part (no valid split)', () => {
    expect(formatDateMDY('nodashes')).toBe('nodashes')
  })

  it('returns the original string when parts are missing (only 2 segments)', () => {
    expect(formatDateMDY('2026-05')).toBe('2026-05')
  })
})
