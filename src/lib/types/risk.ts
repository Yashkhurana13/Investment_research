import { z } from 'zod';

export const RiskAssessmentSchema = z.object({
  macroRisks: z.array(z.string()).describe('Macroeconomic headwinds or risks (e.g. interest rates, inflation)'),
  microRisks: z.array(z.string()).describe('Company-specific and competitive risks'),
  regulatoryConcerns: z.array(z.string()).describe('Regulatory or legal concerns facing the company')
});

export type RiskAssessmentAnalysis = z.infer<typeof RiskAssessmentSchema>;
