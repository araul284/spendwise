export type UseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed';

export type ToolId =
  | 'cursor'
  | 'github_copilot'
  | 'claude'
  | 'chatgpt'
  | 'anthropic_api'
  | 'openai_api'
  | 'gemini'
  | 'windsurf';

export interface ToolEntry {
  toolId: ToolId;
  plan: string;
  seats: number;
  monthlySpend: number; // user-reported, can override
}

export interface AuditInput {
  tools: ToolEntry[];
  teamSize: number;
  useCase: UseCase;
}

export interface AuditFinding {
  toolId: ToolId;
  toolName: string;
  currentPlan: string;
  currentSpend: number;
  status: 'overspending' | 'suboptimal' | 'optimal';
  recommendation: string;
  alternativeTool?: string;
  alternativeToolUrl?: string;
  suggestedSpend: number;
  monthlySavings: number;
  annualSavings: number;
  reason: string;
  credexApplicable: boolean;
}

export interface AuditResult {
  id: string;
  input: AuditInput;
  findings: AuditFinding[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  aiSummary?: string;
  createdAt: string;
  isOptimal: boolean;
}

export interface LeadCapture {
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: number;
  auditId: string;
}

export interface ToolDefinition {
  id: ToolId;
  name: string;
  logo: string;
  color: string;
  plans: PlanDefinition[];
  category: 'ide' | 'chat' | 'api';
  url: string;
  pricingUrl: string;
}

export interface PlanDefinition {
  id: string;
  name: string;
  pricePerSeat: number; // per user/month
  flatPrice?: number;   // if not per-seat
  minSeats?: number;
  maxSeats?: number;
  features: string[];
  useCaseFit: UseCase[];
}