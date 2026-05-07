/**
 * Types for the AI Spend Audit
 */

export enum PlanType {
  FREE = 'Free',
  HOBBY = 'Hobby',
  INDIVIDUAL = 'Individual',
  PRO = 'Pro',
  PLUS = 'Plus',
  TEAM = 'Team',
  BUSINESS = 'Business',
  ENTERPRISE = 'Enterprise',
  API = 'API'
}

export interface ToolSpend {
  toolId: string;
  name: string;
  plan: PlanType;
  monthlySpend: number;
  seats: number;
}

export enum UseCase {
  CODING = 'coding',
  WRITING = 'writing',
  DATA = 'data',
  RESEARCH = 'research',
  MIXED = 'mixed'
}

export interface AuditInput {
  tools: ToolSpend[];
  teamSize: number;
  useCase: UseCase;
}

export interface PlanComparison {
  contextWindow: string;
  maxOutputTokens: string;
  primaryModel: string;
  keyFeatures: string[];
}

export interface AuditRecommendation {
  toolId: string;
  currentPlan: PlanType;
  recommendedPlan: PlanType;
  savingsMonthly: number;
  reason: string;
  action: string;
  comparison?: {
    current: PlanComparison;
    recommended: PlanComparison;
  };
}

export interface AuditResult {
  recommendations: AuditRecommendation[];
  totalSavingsMonthly: number;
  totalSavingsAnnual: number;
  summary?: string;
  id?: string;
  createdAt?: string;
}

export interface LeadInfo {
  email: string;
  company?: string;
  role?: string;
  teamSize?: number;
  auditId: string;
}
