import { AuditInput, AuditResult, PlanType, ToolSpend, AuditRecommendation, PlanComparison } from '../types';

const PLAN_FEATURES: Record<string, Partial<Record<PlanType, PlanComparison>>> = {
  cursor: {
    [PlanType.FREE]: {
      contextWindow: 'Limited',
      maxOutputTokens: '2k',
      primaryModel: 'GPT-4o mini',
      keyFeatures: ['2000 code completions', '50 monthly premium requests']
    },
    [PlanType.PRO]: {
      contextWindow: 'Unlimited',
      maxOutputTokens: 'varies',
      primaryModel: 'Claude 3.5 Sonnet / GPT-4o',
      keyFeatures: ['Unlimited completions', '500 fast premium requests', 'Cursor Prediction']
    },
    [PlanType.BUSINESS]: {
      contextWindow: 'Unlimited',
      maxOutputTokens: 'varies',
      primaryModel: 'Claude 3.5 Sonnet / GPT-4o',
      keyFeatures: ['Admin dashboard', 'SSO/SAML', 'Centralized billing']
    }
  },
  github_copilot: {
    [PlanType.FREE]: {
      contextWindow: 'None',
      maxOutputTokens: '0',
      primaryModel: 'None',
      keyFeatures: ['Limited to public repos']
    },
    [PlanType.INDIVIDUAL]: {
      contextWindow: 'N/A',
      maxOutputTokens: 'N/A',
      primaryModel: 'Codex / GPT-4',
      keyFeatures: ['Standard completion', 'CLI support']
    }
  },
  claude: {
    [PlanType.PRO]: {
      contextWindow: '200k',
      maxOutputTokens: '4k',
      primaryModel: 'Claude 3.5 Sonnet',
      keyFeatures: ['Priority access', 'Early features']
    },
    [PlanType.TEAM]: {
      contextWindow: '200k',
      maxOutputTokens: '4k',
      primaryModel: 'Claude 3.5 Sonnet',
      keyFeatures: ['Higher usage limits', 'Admin console', 'Billing']
    }
  },
  chatgpt: {
    [PlanType.FREE]: {
      contextWindow: 'Limited',
      maxOutputTokens: 'varies',
      primaryModel: 'GPT-4o mini',
      keyFeatures: ['Standard access']
    },
    [PlanType.PLUS]: {
      contextWindow: '128k',
      maxOutputTokens: '4k',
      primaryModel: 'GPT-4o',
      keyFeatures: ['DALL-E', 'Data Analysis', 'Early access to new models']
    }
  },
  gemini: {
    [PlanType.FREE]: {
      contextWindow: '32k',
      maxOutputTokens: 'varies',
      primaryModel: 'Gemini 1.5 Flash',
      keyFeatures: ['Google app integrations']
    },
    [PlanType.PRO]: {
      contextWindow: '1M+',
      maxOutputTokens: 'varies',
      primaryModel: 'Gemini 1.5 Pro',
      keyFeatures: ['Massive context window', 'Advanced AI features']
    }
  }
};

export class AuditEngine {
  public static calculate(input: AuditInput): AuditResult {
    const recommendations: AuditRecommendation[] = [];
    let totalSavingsMonthly = 0;

    for (const tool of input.tools) {
      const rec = this.getRecommendationForTool(tool, input);
      if (rec) {
        // Hydrate comparison data
        if (PLAN_FEATURES[tool.toolId]) {
          const currentFeatures = PLAN_FEATURES[tool.toolId][rec.currentPlan];
          const recommendedFeatures = PLAN_FEATURES[tool.toolId][rec.recommendedPlan];
          if (currentFeatures && recommendedFeatures) {
            rec.comparison = {
              current: currentFeatures,
              recommended: recommendedFeatures
            };
          }
        }
        
        recommendations.push(rec);
        totalSavingsMonthly += rec.savingsMonthly;
      }
    }

    // Overall stack optimizations
    const globalSavings = this.getGlobalOptimizations(input, recommendations);
    totalSavingsMonthly += globalSavings.savings;
    recommendations.push(...globalSavings.recs);

    return {
      recommendations,
      totalSavingsMonthly,
      totalSavingsAnnual: totalSavingsMonthly * 12,
    };
  }

  private static getRecommendationForTool(tool: ToolSpend, audit: AuditInput): AuditRecommendation | null {
    switch (tool.toolId) {
      case 'cursor':
        return this.auditCursor(tool, audit);
      case 'github_copilot':
        return this.auditCopilot(tool, audit);
      case 'claude':
        return this.auditClaude(tool, audit);
      case 'chatgpt':
        return this.auditChatGPT(tool, audit);
      case 'gemini':
        return this.auditGemini(tool, audit);
      default:
        return null;
    }
  }

  private static auditCursor(tool: ToolSpend, audit: AuditInput): AuditRecommendation | null {
    if (tool.plan === PlanType.BUSINESS && tool.seats < 3) {
       return {
         toolId: tool.toolId,
         currentPlan: PlanType.BUSINESS,
         recommendedPlan: PlanType.PRO,
         savingsMonthly: (tool.monthlySpend - (20 * tool.seats)),
         reason: 'Business tier of Cursor is overkill for small teams/solo devs.',
         action: 'Downgrade to Pro'
       };
    }
    return null;
  }

  private static auditCopilot(tool: ToolSpend, audit: AuditInput): AuditRecommendation | null {
    // If they have Cursor AND Copilot, they are redundant
    const hasCursor = audit.tools.some(t => t.toolId === 'cursor');
    if (hasCursor) {
      return {
        toolId: tool.toolId,
        currentPlan: tool.plan,
        recommendedPlan: PlanType.FREE,
        savingsMonthly: tool.monthlySpend,
        reason: 'Cursor includes everything GitHub Copilot does and more.',
        action: 'Cancel Copilot'
      };
    }
    return null;
  }

  private static auditClaude(tool: ToolSpend, audit: AuditInput): AuditRecommendation | null {
    if (tool.plan === PlanType.TEAM && tool.seats < 5) {
      return {
        toolId: tool.toolId,
        currentPlan: PlanType.TEAM,
        recommendedPlan: PlanType.PRO,
        savingsMonthly: tool.monthlySpend - (20 * tool.seats),
        reason: 'Claude Team plan requires 5 seats; Individual Pro saves you money.',
        action: 'Switch to Pro'
      };
    }
    return null;
  }

  private static auditChatGPT(tool: ToolSpend, audit: AuditInput): AuditRecommendation | null {
    if (audit.useCase === 'coding' && tool.plan === PlanType.PLUS) {
       // Deep reasoning: If coding, Claude/Cursor are better ROI 
       // but we only recommend direct alternatives if obvious
    }
    return null;
  }

  private static auditGemini(tool: ToolSpend, audit: AuditInput): AuditRecommendation | null {
    return null;
  }

  private static getGlobalOptimizations(input: AuditInput, currentRecs: AuditRecommendation[]) {
    const recs: AuditRecommendation[] = [];
    let savings = 0;
    
    // Logic: If paying for 3+ chats (ChatGPT, Claude, Gemini)
    const chatTools = input.tools.filter(t => ['chatgpt', 'claude', 'gemini'].includes(t.toolId));
    if (chatTools.length > 2) {
       savings += 20; // Assume one can be dropped
       recs.push({
         toolId: 'cross_stack',
         currentPlan: PlanType.INDIVIDUAL,
         recommendedPlan: PlanType.FREE,
         savingsMonthly: 20,
         reason: 'Triple redundancy in chat models. Drop one of Gemini/ChatGPT/Claude.',
         action: 'Consolidate Chats'
       });
    }

    return { recs, savings };
  }
}
