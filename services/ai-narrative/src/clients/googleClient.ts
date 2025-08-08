import { GoogleGenAI, Type } from '@google/genai';

// Інтерфейс клієнта LLM для зручного мокання у тестах
export interface LanguageModelClient {
    generate(prompt: string): Promise<string>;
}

// Побудова схеми відповіді під наш JSON-формат (див. NarrativeResponseSchema)
function buildResponseSchema() {
    return {
        type: Type.OBJECT,
        properties: {
            narration: { type: Type.STRING },
            worldChanges: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        target: { type: Type.STRING },
                        change: { type: Type.STRING },
                    },
                    propertyOrdering: ['target', 'change'],
                },
            },
            toolCalls: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        arguments: { type: Type.OBJECT },
                    },
                    propertyOrdering: ['name', 'arguments'],
                },
            },
        },
        propertyOrdering: ['narration', 'worldChanges', 'toolCalls'],
    } as const;
}

// Адаптер для офіційного SDK Google Gemini (structured output)
export class GoogleGenerativeClient implements LanguageModelClient {
    private readonly ai: GoogleGenAI;
    private readonly modelName: string;

    constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
        this.ai = new GoogleGenAI({ apiKey });
        this.modelName = modelName;
    }

    async generate(prompt: string): Promise<string> {
        const response = await this.ai.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: buildResponseSchema(),
            },
        });
        const text = (response as any).text ?? response.text;
        if (typeof text !== 'string' || text.length === 0) {
            throw new Error('Gemini SDK: порожня відповідь');
        }
        return text;
    }
}




