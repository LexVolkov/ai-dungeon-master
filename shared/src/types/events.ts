// Загальні типи для подій у системі
export interface EventPayload {
    /** Ідентифікатор ігрової сесії */
    sessionId: string;
}

export interface PlayerActionPayload extends EventPayload {
    /** Назва або код дії (наприклад: "move", "attack") */
    action: string;
    /** Ідентифікатор гравця */
    playerId: string;
    /** Ідентифікатор персонажа */
    characterId: string;
    /** Додаткові параметри дії */
    params?: Record<string, unknown>;
}

export interface GameUpdatePayload extends EventPayload {
    /** Текст оповіді для клієнта */
    narrative: string;
    /** Зміни у світі, які слід застосувати */
    worldChanges?: Array<{ target: string; change: string }>;
    /** Оновлення атрибутів персонажів */
    characterUpdates?: Array<{ characterId: string; updates: Record<string, unknown> }>;
}

export interface AiGenerateNarrativePayload extends EventPayload {
    /** Повний контекст для LLM */
    context: string;
}

export interface MemoryGetContextPayload extends EventPayload {
    /** Текстовий запит для отримання контексту */
    query: string;
    /** Для персоналізованого контексту */
    characterId?: string;
}

export interface ContextResponsePayload extends EventPayload {
    /** Агрегований контекст */
    context: string;
}

export interface NarrativeResponsePayload extends EventPayload {
    /** Згенерований текст оповіді */
    narration: string;
    /** Запропоновані зміни світу для подальшої оркестрації */
    worldChanges: Array<{ target: string; change: string }>;
    /** Виклики інструментів/функцій */
    toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
}

export interface WorldChangePayload extends EventPayload {
    /** Зміни світу, підтверджені до застосування */
    changes: Array<{ target: string; change: string }>;
}

export interface RuleDetailsPayload extends EventPayload {
    /** Тип правила (наприклад: "spell", "combat") */
    ruleType: string;
    /** Назва правила */
    ruleName: string;
}

// Додайте інші типи подій за потреби


