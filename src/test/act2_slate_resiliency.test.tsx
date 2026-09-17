import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { MONTHS, formatMonthShort } from '@/utils/dateFormatter';

describe('formatMonthShort resilience unit invariants', () => {
  it('correctly maps month name strings to 3-letter uppercase abbreviations', () => {
    expect(formatMonthShort('March')).toBe('MAR');
    expect(formatMonthShort('march')).toBe('MAR');
    expect(formatMonthShort('October')).toBe('OCT');
    expect(formatMonthShort('JANUARY')).toBe('JAN');
    expect(formatMonthShort('September')).toBe('SEP');
  });

  it('correctly maps 1-indexed numeric strings to 3-letter abbreviations', () => {
    expect(formatMonthShort('1')).toBe('JAN');
    expect(formatMonthShort('3')).toBe('MAR');
    expect(formatMonthShort('10')).toBe('OCT');
    expect(formatMonthShort('12')).toBe('DEC');
  });

  it('correctly maps raw numbers to 3-letter abbreviations', () => {
    expect(formatMonthShort(1)).toBe('JAN');
    expect(formatMonthShort(3)).toBe('MAR');
    expect(formatMonthShort(12)).toBe('DEC');
  });

  it('handles boundary and 0-indexed values gracefully without throwing', () => {
    expect(formatMonthShort(0)).toBe('JAN');
    expect(formatMonthShort('0')).toBe('JAN');
    expect(formatMonthShort('13')).toBe('13');
  });

  it('safely handles empty, nullish, or placeholder tokens', () => {
    expect(formatMonthShort('')).toBe('');
    expect(formatMonthShort('   ')).toBe('');
    expect(formatMonthShort(null)).toBe('');
    expect(formatMonthShort(undefined)).toBe('');
    expect(formatMonthShort('none')).toBe('');
    expect(formatMonthShort('NONE')).toBe('');
  });

  it('handles arbitrary strings without throwing exceptions', () => {
    expect(formatMonthShort('Autumn')).toBe('AUT');
    expect(formatMonthShort('Spring')).toBe('SPR');
  });
});

describe('Act II Metadata Slate Rendering & Static Code Invariant Shield', () => {
  // Test the exact JSX render logic used in MemoryForm Act II
  const CompactSlate = ({ day, month, year }: { day?: string; month?: string; year?: string }) => (
    <span data-testid="compact-slate" className="text-[9px] font-black uppercase tracking-widest text-white/80">
      {day !== 'none' && day ? day : ''} {formatMonthShort(month)} {year !== 'none' && year ? year : 'UNDATED'}
    </span>
  );

  it('renders Act II slate with "14 MAR 1884" for template-default month string ("March")', () => {
    render(<CompactSlate day="14" month="March" year="1884" />);
    expect(screen.getByTestId('compact-slate').textContent?.trim()).toBe('14 MAR 1884');
  });

  it('renders Act II slate with "25 OCT 1995" for numeric string ("10")', () => {
    render(<CompactSlate day="25" month="10" year="1995" />);
    expect(screen.getByTestId('compact-slate').textContent?.trim()).toBe('25 OCT 1995');
  });

  it('renders Act II slate with "UNDATED" when year and month are none', () => {
    render(<CompactSlate day="none" month="none" year="none" />);
    expect(screen.getByTestId('compact-slate').textContent?.trim()).toBe('UNDATED');
  });

  it('does not throw when month is empty string, 0, or invalid', () => {
    expect(() => render(<CompactSlate day="1" month="" year="2000" />)).not.toThrow();
    expect(() => render(<CompactSlate day="1" month="0" year="2000" />)).not.toThrow();
    expect(() => render(<CompactSlate day="1" month="13" year="2000" />)).not.toThrow();
  });

  it('STATIC AUDIT: MemoryForm.tsx MUST NOT contain unsafe MONTHS[parseInt(month)-1].substring', () => {
    const memoryFormPath = path.resolve(process.cwd(), 'src/components/studio/MemoryForm.tsx');
    const content = fs.readFileSync(memoryFormPath, 'utf-8');

    // Asserts that the exact crash expression was removed
    expect(content).not.toContain('MONTHS[parseInt(month)-1].substring');
    // Asserts that the resilient formatter is bound to the Act II slate
    expect(content).toContain('formatMonthShort(month)');
  });
});