import { z } from 'zod';

// Схеми валідації відповіді від LLM
export const WorldChangeSchema = z.object({
    target: z.string(),
    change: z.string(),
});

export const ToolCallSchema = z.object({
    name: z.string(),
    arguments: z.record(z.any()).default({}),
});

export const NarrativeResponseSchema = z.object({
    narration: z.string().min(1),
    worldChanges: z.array(WorldChangeSchema).default([]),
    toolCalls: z.array(ToolCallSchema).optional(),
});

export type NarrativeResponse = z.infer<typeof NarrativeResponseSchema>;


