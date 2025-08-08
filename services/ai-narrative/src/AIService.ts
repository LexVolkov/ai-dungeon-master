import { z } from 'zod';
import { NarrativeResponseSchema, type NarrativeResponse } from './schemas/narrativeSchemas';
import type { LanguageModelClient } from './clients/googleClient';

export interface AIServiceOptions {
    systemPrompt?: string;
}

// Сервіс генерації нарративу з валідацією Zod
export class AIService {
    private readonly systemPrompt: string;

    constructor(
        private readonly llmClient: LanguageModelClient,
        options: AIServiceOptions = {},
    ) {
        this.systemPrompt = options.systemPrompt ??
            'Виступай як Майстер DnD. Повертай ТІЛЬКИ валідний JSON, що відповідає схемі: { narration: string, worldChanges: Array<{target: string, change: string}>, toolCalls?: Array<{name: string, arguments: object}> }.';
    }

    async generateNarrative(context: string): Promise<NarrativeResponse> {
        const prompt = this.buildPrompt(context);
        const raw = await this.llmClient.generate(prompt);
        const jsonObject = this.ensureJsonObject(raw);
        return NarrativeResponseSchema.parse(jsonObject);
    }

    private buildPrompt(context: string): string {
        return [
            this.systemPrompt,
            'Контекст пригоди нижче. Згенеруй захопливий опис сцени та опиши потенційні зміни світу, не змінюючи стан напряму.',
            'Контекст:',
            context,
        ].join('\n\n');
    }

    private ensureJsonObject(raw: string): unknown {
        // Іноді моделі загортають JSON у код-блоки. Спробуємо витягнути чистий JSON
        const cleaned = this.stripFence(raw);
        try {
            return JSON.parse(cleaned);
        } catch (e) {
            throw new Error('Невалідний JSON від моделі LLM');
        }
    }

    private stripFence(raw: string): string {
        const trimmed = raw.trim();
        if (trimmed.startsWith('```')) {
            const match = trimmed.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return trimmed;
    }
}


