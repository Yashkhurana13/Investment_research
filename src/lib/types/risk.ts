import { z } from 'zod';

const RiskItemSchema = z.object({
  description: z.string().describe('The risk description'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).describe('The severity of this risk')
});

export const RiskAssessmentSchema = z.object({
  macroRisks: z.array(RiskItemSchema).describe('Macroeconomic headwinds or risks (e.g. interest rates, inflation)'),
  microRisks: z.array(RiskItemSchema).describe('Company-specific and competitive risks'),
  regulatoryConcerns: z.array(RiskItemSchema).describe('Regulatory or legal concerns facing the company')
});

export type RiskAssessmentAnalysis = z.infer<typeof RiskAssessmentSchema>;
