import { ShortTermMemoryEvent } from '@shared/types/entities';
import { IRepository } from '@shared/interfaces/repository';

export interface MemoryManagerConfig {
    /** Скільки останніх подій брати для контексту за замовчуванням */
    defaultContextLimit: number;
}

/**
 * Менеджер пам'яті працює з короткостроковими подіями через абстракцію репозиторію
 */
export class MemoryManager {
    private readonly repository: IRepository<ShortTermMemoryEvent> & {
        getLastEvents(sessionId: string, limit: number): Promise<ShortTermMemoryEvent[]>;
    };
    private readonly config: MemoryManagerConfig;

    constructor(
        repository: IRepository<ShortTermMemoryEvent> & {
            getLastEvents(sessionId: string, limit: number): Promise<ShortTermMemoryEvent[]>;
        },
        config: MemoryManagerConfig
    ) {
        this.repository = repository;
        this.config = config;
    }

    /** Зберегти нову подію у короткострокову пам'ять */
    async saveEvent(event: Omit<ShortTermMemoryEvent, 'id'>): Promise<ShortTermMemoryEvent> {
        return this.repository.create(event);
    }

    /**
     * Отримати текстовий контекст з останніх N подій для певної сесії
     */
    async buildContext(sessionId: string, limit?: number): Promise<string> {
        const effectiveLimit = limit ?? this.config.defaultContextLimit;
        const events = await this.repository.getLastEvents(sessionId, effectiveLimit);
        return MemoryManager.formatEventsToContext(events);
    }

    /**
     * Форматування подій у компактний, але інформативний текстовий контекст
     */
    static formatEventsToContext(events: ShortTermMemoryEvent[]): string {
        if (!events.length) return '';
        const lines = events.map((e) => {
            const ts = new Date(e.timestamp).toISOString();
            const payloadPreview = MemoryManager.stringifyPayload(e.payload);
            return `[${ts}] (${e.eventType}) session=${e.sessionId} payload=${payloadPreview}`;
        });
        return lines.join('\n');
    }

    private static stringifyPayload(payload: Record<string, unknown>): string {
        try {
            // Стисле представлення без непотрібних пробілів
            return JSON.stringify(payload);
        } catch {
            return '{}';
        }
    }
}


