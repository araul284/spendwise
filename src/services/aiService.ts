//ai summary generator
import { GoogleGenAI } from "@google/genai";
import { AuditResult, ToolSpend } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAuditSummary(result: AuditResult, tools: ToolSpend[], teamSize: number, useCase: string): Promise<string> {
  const breakdown = result.recommendations.map(r => 
    `- ${r.toolId}: ${r.action} (${r.reason}) - Save $${r.savingsMonthly}/mo`
  ).join('\n');

  const prompt = `You are a senior financial auditor specializing in AI tool optimization for tech companies.
The following is an audit of an AI tool stack:
Team Size: ${teamSize}
Primary Use Case: ${useCase}
Total Overspend: $${result.totalSavingsMonthly} per month

Tool Breakdown:
${breakdown}

Write a concise, professional summary (~100 words) for a CTO or Finance Lead. 
Focus on the most impactful changes. 
Do not be overly critical, focus on ROI and efficiency.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Audit complete. We've found several ways to optimize your AI spend.";
  } catch (error) {
    console.error("AI Summary generation failed", error);
    return `Based on your team size of ${teamSize} and use case of ${useCase}, we've identified potential savings of $${result.totalSavingsMonthly} per month. Consider consolidating your tools to maximize efficiency.`;
  }
}

