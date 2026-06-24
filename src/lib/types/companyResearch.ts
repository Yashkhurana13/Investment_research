import { z } from 'zod';

export const CompanyResearchSchema = z.object({
  sentimentScore: z.number().min(0).max(100).describe('Sentiment score from 0 to 100 based on recent news'),
  newsSummary: z.string().describe('A concise summary of recent news and developments'),
  catalysts: z.array(z.string()).describe('A list of potential upcoming growth catalysts')
});

export type CompanyResearchAnalysis = z.infer<typeof CompanyResearchSchema>;
