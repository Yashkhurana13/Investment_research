import { z } from 'zod';

export const BullThesisSchema = z.object({
  score: z.number().min(0).max(10).describe('A score from 0-10 on the strength of the bull case'),
  thesis: z.string().describe('The primary bull thesis text'),
  supportingEvidence: z.array(z.string()).describe('List of evidence citing facts from the package'),
  confidence: z.number().min(0).max(100).describe('Confidence in this bull thesis (0-100)')
});

export type BullThesisAnalysis = z.infer<typeof BullThesisSchema>;

export const BearThesisSchema = z.object({
  score: z.number().min(0).max(10).describe('A score from 0-10 on the strength of the bear case'),
  thesis: z.string().describe('The primary bear thesis text'),
  supportingEvidence: z.array(z.string()).describe('List of evidence citing facts from the package'),
  confidence: z.number().min(0).max(100).describe('Confidence in this bear thesis (0-100)')
});

export type BearThesisAnalysis = z.infer<typeof BearThesisSchema>;

export const JudgeVerdictSchema = z.object({
  recommendation: z.enum(["INVEST", "WATCHLIST", "PASS", "NEEDS_REVIEW"]).describe('Final recommendation'),
  confidenceScore: z.number().min(0).max(100).describe('Final confidence score for the verdict'),
  finalReasoning: z.string().describe('The rationale justifying the final decision'),
  winningSide: z.enum(["BULL", "BEAR", "BALANCED"]).describe('Which side won the debate')
});

export type JudgeVerdictAnalysis = z.infer<typeof JudgeVerdictSchema>;
