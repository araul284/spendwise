import { describe, it, expect } from 'vitest';
import { runAudit } from '../lib/AuditEngine';
import type { AuditInput } from '../types/index.ts';


// ─── Test 1: Cursor Business overkill for small team ─────────────────────────
describe('Audit engine — plan fit rules', () => {
  it('flags Cursor Business as overspending for a 2-person team', () => {
    const input: AuditInput = {
      teamSize: 2,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', plan: 'business', seats: 2, monthlySpend: 0 }],
    };
    const result = runAudit(input);
    const finding = result.findings[0];
    expect(finding.status).toBe('overspending');
    expect(finding.monthlySavings).toBeGreaterThan(0);
    // Business: $40/seat, Pro: $20/seat — 2 seats saves $40/mo
    expect(finding.monthlySavings).toBe(40);
  });

  // ─── Test 2: Cursor Pro for 5-person team is optimal ─────────────────────
  it('marks Cursor Pro as optimal for a 5-person coding team', () => {
    const input: AuditInput = {
      teamSize: 5,
      useCase: 'coding',
      tools: [{ toolId: 'cursor', plan: 'pro', seats: 5, monthlySpend: 0 }],
    };
    const result = runAudit(input);
    const finding = result.findings[0];
    expect(finding.status).toBe('optimal');
    expect(finding.monthlySavings).toBe(0);
  });

  // ─── Test 3: IDE overlap detection ───────────────────────────────────────
  it('detects IDE overlap when Cursor and GitHub Copilot are both paid', () => {
    const input: AuditInput = {
      teamSize: 4,
      useCase: 'coding',
      tools: [
        { toolId: 'cursor', plan: 'pro', seats: 4, monthlySpend: 0 },
        { toolId: 'github_copilot', plan: 'individual', seats: 4, monthlySpend: 0 },
      ],
    };
    const result = runAudit(input);
    const overTools = result.findings.filter(f => f.status === 'overspending');
    // At least one of the two should be flagged as overspending
    expect(overTools.length).toBeGreaterThan(0);
    // Total savings should be positive
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
  });

  // ─── Test 4: Claude Team with insufficient seats ──────────────────────────
  it('flags Claude Team as overspending when only 2 seats are purchased', () => {
    const input: AuditInput = {
      teamSize: 2,
      useCase: 'writing',
      tools: [{ toolId: 'claude', plan: 'team', seats: 2, monthlySpend: 60 }],
    };
    const result = runAudit(input);
    const finding = result.findings[0];
    expect(finding.status).toBe('overspending');
    // Team ($30/seat) vs Pro ($20/seat) for 2 seats = $20/mo savings
    expect(finding.monthlySavings).toBe(20);
  });

  // ─── Test 5: Large API spend triggers Credex flag ────────────────────────
  it('marks Anthropic API as overspending and credexApplicable at $600/mo', () => {
    const input: AuditInput = {
      teamSize: 10,
      useCase: 'data',
      tools: [{ toolId: 'anthropic_api', plan: 'payg', seats: 1, monthlySpend: 600 }],
    };
    const result = runAudit(input);
    const finding = result.findings[0];
    expect(finding.status).toBe('overspending');
    expect(finding.credexApplicable).toBe(true);
    expect(finding.monthlySavings).toBeGreaterThan(0);
  });

  // ─── Test 6: Already-optimal stack returns zero savings ──────────────────
  it('returns zero savings for a well-optimised single-tool stack', () => {
    const input: AuditInput = {
      teamSize: 10,
      useCase: 'coding',
      tools: [
        { toolId: 'cursor', plan: 'pro', seats: 10, monthlySpend: 0 },
      ],
    };
    const result = runAudit(input);
    expect(result.totalMonthlySavings).toBe(0);
    expect(result.isOptimal).toBe(true);
  });

  // ─── Test 7: Annual savings = monthly × 12 ───────────────────────────────
  it('calculates annual savings as exactly 12× monthly savings', () => {
    const input: AuditInput = {
      teamSize: 3,
      useCase: 'coding',
      tools: [
        { toolId: 'cursor', plan: 'business', seats: 3, monthlySpend: 0 },
      ],
    };
    const result = runAudit(input);
    expect(result.totalAnnualSavings).toBe(result.totalMonthlySavings * 12);
  });

  // ─── Test 8: Copilot Enterprise overkill for small team ──────────────────
  it('flags GitHub Copilot Enterprise as overspending for 2 seats', () => {
    const input: AuditInput = {
      teamSize: 2,
      useCase: 'coding',
      tools: [{ toolId: 'github_copilot', plan: 'enterprise', seats: 2, monthlySpend: 0 }],
    };
    const result = runAudit(input);
    const finding = result.findings[0];
    // Enterprise $39/seat → Business $19/seat = $40/mo savings for 2 seats
    expect(finding.status).toBe('overspending');
    expect(finding.monthlySavings).toBe(40);
  });
});