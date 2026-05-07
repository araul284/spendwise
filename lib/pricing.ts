export type ToolName =
  | 'Cursor' | 'GitHub Copilot' | 'ChatGPT' | 'Claude'
  | 'OpenAI API' | 'Anthropic API' | 'Gemini' | 'Windsurf'

export type Plan = {
  name: string
  priceMonthly: number // per seat, $0 if not seat-based
  minSeats?: number
  seatBased: boolean
  notes?: string
}

export const PRICING: Record<ToolName, Plan[]> = {
  'Cursor': [
    { name: 'Hobby', priceMonthly: 0, seatBased: true },
    { name: 'Pro', priceMonthly: 20, seatBased: true },
    { name: 'Business', priceMonthly: 40, seatBased: true, minSeats: 2 }
  ],
  'GitHub Copilot': [
    { name: 'Individual', priceMonthly: 10, seatBased: true },
    { name: 'Business', priceMonthly: 19, seatBased: true },
    { name: 'Enterprise', priceMonthly: 39, seatBased: true }
  ],
  'ChatGPT': [
    { name: 'Plus', priceMonthly: 20, seatBased: true },
    { name: 'Team', priceMonthly: 25, seatBased: true, minSeats: 2, notes: '$30/mo if billed monthly' },
    { name: 'Enterprise', priceMonthly: 0, seatBased: false, notes: 'Custom pricing' }
  ],
  'Claude': [
    { name: 'Pro', priceMonthly: 20, seatBased: true },
    { name: 'Team', priceMonthly: 25, seatBased: true, minSeats: 5 }
  ],
  'OpenAI API': [
    { name: 'GPT-4o', priceMonthly: 0, seatBased: false, notes: 'Usage based: $5/$15 per 1M tokens' }
  ],
  'Anthropic API': [
    { name: 'Claude 3.5 Sonnet', priceMonthly: 0, seatBased: false, notes: 'Usage based: $3/$15 per 1M tokens' }
  ],
  'Gemini': [
    { name: 'Gemini Advanced', priceMonthly: 19.99, seatBased: false }
  ],
  'Windsurf': [
    { name: 'Pro', priceMonthly: 15, seatBased: true }
  ]
}

export function getPlan(tool: ToolName, planName: string): Plan | undefined {
  return PRICING[tool].find(p => p.name === planName)
}

export function calcPlanCost(tool: ToolName, planName: string, seats: number): number {
  const plan = getPlan(tool, planName)
  if (!plan) return 0
  if (!plan.seatBased) return plan.priceMonthly
  return plan.priceMonthly * seats
}