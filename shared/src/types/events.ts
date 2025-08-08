// Загальні типи для подій у системі
export interface EventPayload {
    sessionId: string;
    [key: string]: any; // Для гнучкості, але в реальному проєкті краще конкретизувати
}

export interface PlayerActionPayload extends EventPayload {
    action: string;
    playerId: string;
    characterId: string;
    // Додаткові дані дії гравця
}

export interface GameUpdatePayload extends EventPayload {
    narrative: string;
    worldChanges?: Array<{ target: string; change: string }>;
    characterUpdates?: Array<{ characterId: string; updates: Record<string, any> }>;
    // Додаткові оновлення для клієнта
}

export interface AiGenerateNarrativePayload extends EventPayload {
    context: string; // Повний контекст для LLM
}

export interface MemoryGetContextPayload extends EventPayload {
    query: string;
    characterId?: string; // Для персоналізованого контексту
}

export interface ContextResponsePayload extends EventPayload {
    context: string;
}

export interface NarrativeResponsePayload extends EventPayload {
    narration: string;
    worldChanges: Array<{ target: string; change: string }>;
    toolCalls?: Array<{ name: string; arguments: Record<string, any> }>;
}

export interface WorldChangePayload extends EventPayload {
    changes: Array<{ target: string; change: string }>;
}

export interface RuleDetailsPayload extends EventPayload {
    ruleType: string;
    ruleName: string;
}

// Додайте інші типи подій за потреби


