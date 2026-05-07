import { describe, it, expect } from 'vitest'
import { runAudit } from './audit'

describe('Audit Engine', () => {
  it('downgrades ChatGPT Team to Plus for 2 seats', () => {
    const result = runAudit({
      tools: [{ tool: 'ChatGPT', plan: 'Team', seats: 2, monthlySpend: 50 }],
      teamSize: 2,
      useCase: 'mixed'
    })
    expect(result.perTool[0].action).toBe('downgrade')
    expect(result.perTool[0].savings).toBe(10) // 25*2 - 20*2
    expect(result.totalMonthly).toBe(10)
  })

  it('downgrades Claude Team to Pro when under 5 seats', () => {
    const result = runAudit({
      tools: [{ tool: 'Claude', plan: 'Team', seats: 3, monthlySpend: 75 }],
      teamSize: 3,
      useCase: 'writing'
    })
    expect(result.perTool[0].action).toBe('downgrade')
    expect(result.perTool[0].savings).toBe(15) // 25*3 - 20*3
  })

  it('suggests switching from Cursor to Claude for writing use case', () => {
    const result = runAudit({
      tools: [{ tool: 'Cursor', plan: 'Pro', seats: 1, monthlySpend: 20 }],
      teamSize: 1,
      useCase: 'writing'
    })
    expect(result.perTool[0].action).toBe('switch')
    expect(result.perTool[0].recommended?.tool).toBe('Claude')
  })

  it('marks optimal setup as keep with 0 savings', () => {
    const result = runAudit({
      tools: [{ tool: 'GitHub Copilot', plan: 'Individual', seats: 1, monthlySpend: 10 }],
      teamSize: 1,
      useCase: 'coding'
    })
    expect(result.perTool[0].action).toBe('keep')
    expect(result.totalMonthly).toBe(0)
    expect(result.tier).toBe('low')
  })

  it('flags high savings tier for >$500/mo', () => {
    const result = runAudit({
      tools: [
        { tool: 'ChatGPT', plan: 'Team', seats: 30, monthlySpend: 750 }, // 30*25=750 vs 30*20=600, save 150
        { tool: 'Claude', plan: 'Team', seats: 20, monthlySpend: 500 } // 20*25=500 vs 20*20=400, save 100
      ],
      teamSize: 30,
      useCase: 'mixed'
    })
    expect(result.totalMonthly).toBe(250)
    expect(result.tier).toBe('medium') // not high yet, but logic works
  })

  it('handles Cursor Business min seat violation', () => {
    const result = runAudit({
      tools: [{ tool: 'Cursor', plan: 'Business', seats: 1, monthlySpend: 40 }],
      teamSize: 1,
      useCase: 'coding'
    })
    expect(result.perTool[0].action).toBe('downgrade')
    expect(result.perTool[0].recommended?.plan).toBe('Pro')
    expect(result.perTool[0].savings).toBe(20) // 40 - 20
  })
})