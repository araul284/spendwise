import { ToolName, getPlan, calcPlanCost, PRICING } from './pricing'

export type UseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed'

export type ToolInput = {
  tool: ToolName
  plan: string
  seats: number
  monthlySpend: number // user-reported, for sanity check
}

export type ToolAudit = {
  tool: ToolName
  action: 'keep' | 'downgrade' | 'switch' | 'consolidate'
  currentMonthly: number
  recommendedMonthly: number
  savings: number
  reason: string
  recommended?: { tool: ToolName, plan: string, seats: number }
}

export type AuditResult = {
  perTool: ToolAudit[]
  totalMonthly: number
  totalAnnual: number
  tier: 'low' | 'medium' | 'high' // <100, 100-500, >500
}

export function runAudit(input: { tools: ToolInput[], teamSize: number, useCase: UseCase }): AuditResult {
  const perTool: ToolAudit[] = input.tools.map(t => auditSingleTool(t, input.teamSize, input.useCase))

  const totalMonthly = perTool.reduce((sum, t) => sum + t.savings, 0)
  const totalAnnual = totalMonthly * 12

  let tier: AuditResult['tier'] = 'low'
  if (totalMonthly >= 500) tier = 'high'
  else if (totalMonthly >= 100) tier = 'medium'

  return { perTool, totalMonthly, totalAnnual, tier }
}

function auditSingleTool(input: ToolInput, teamSize: number, useCase: UseCase): ToolAudit {
  const plan = getPlan(input.tool, input.plan)
  if (!plan) throw new Error(`Unknown plan ${input.plan} for ${input.tool}`)

  const currentMonthly = plan.seatBased
   ? calcPlanCost(input.tool, input.plan, input.seats)
    : input.monthlySpend // for API usage, trust user input

  // Rule 1: Seat minimum violations
  if (plan.minSeats && input.seats < plan.minSeats) {
    const downgradePlan = PRICING[input.tool].find(p =>!p.minSeats || p.minSeats <= input.seats)
    if (downgradePlan) {
      const newCost = calcPlanCost(input.tool, downgradePlan.name, input.seats)
      return {
        tool: input.tool,
        action: 'downgrade',
        currentMonthly,
        recommendedMonthly: newCost,
        savings: currentMonthly - newCost,
        reason: `${input.plan} requires ${plan.minSeats}+ seats. ${downgradePlan.name} fits ${input.seats} seats.`,
        recommended: { tool: input.tool, plan: downgradePlan.name, seats: input.seats }
      }
    }
  }

  // Rule 2: ChatGPT Team vs Plus for small teams
  if (input.tool === 'ChatGPT' && input.plan === 'Team' && input.seats < 5) {
    const plusCost = calcPlanCost('ChatGPT', 'Plus', input.seats)
    if (plusCost < currentMonthly) {
      return {
        tool: input.tool,
        action: 'downgrade',
        currentMonthly,
        recommendedMonthly: plusCost,
        savings: currentMonthly - plusCost,
        reason: `Team is $25/seat with 2+ min. For ${input.seats} seats, Plus at $20/seat is cheaper.`,
        recommended: { tool: input.tool, plan: 'Plus', seats: input.seats }
      }
    }
  }

  // Rule 3: Claude Team vs Pro for small teams
  if (input.tool === 'Claude' && input.plan === 'Team' && input.seats < 5) {
    const proCost = calcPlanCost('Claude', 'Pro', input.seats)
    return {
      tool: input.tool,
      action: 'downgrade',
      currentMonthly,
      recommendedMonthly: proCost,
      savings: currentMonthly - proCost,
      reason: `Claude Team requires 5+ seats. Pro is $20/seat with same model access.`,
      recommended: { tool: input.tool, plan: 'Pro', seats: input.seats }
    }
  }

  // Rule 4: Cursor for non-coding use case
  if (input.tool === 'Cursor' && useCase === 'writing' && input.plan === 'Pro') {
    const claudeCost = calcPlanCost('Claude', 'Pro', input.seats)
    if (claudeCost <= currentMonthly) {
      return {
        tool: input.tool,
        action: 'switch',
        currentMonthly,
        recommendedMonthly: claudeCost,
        savings: currentMonthly - claudeCost,
        reason: `Cursor Pro is IDE-focused. For writing, Claude Pro has equal quality at same or lower cost.`,
        recommended: { tool: 'Claude', plan: 'Pro', seats: input.seats }
      }
    }
  }

  // Rule 5: Copilot Individual when you already have Business seat overlap
  if (input.tool === 'GitHub Copilot' && input.plan === 'Individual') {
    const businessCost = calcPlanCost('GitHub Copilot', 'Business', input.seats)
    // Can't suggest upgrade, but if teamSize > seats, flag it
    if (teamSize > input.seats) {
      return {
        tool: input.tool,
        action: 'keep',
        currentMonthly,
        recommendedMonthly: currentMonthly,
        savings: 0,
        reason: `Individual plan is correct for ${input.seats} seats. Consider Business if entire ${teamSize}-person team needs access.`
      }
    }
  }

  // Default: keep
  return {
    tool: input.tool,
    action: 'keep',
    currentMonthly,
    recommendedMonthly: currentMonthly,
    savings: 0,
    reason: `Your ${input.plan} plan matches ${input.seats} seats. No cheaper alternative found.`
  }
}