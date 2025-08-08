import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { IRepository } from '@shared/interfaces/repository';
import { ShortTermMemoryEvent } from '@shared/types/entities';

/**
 * Репозиторій подій короткострокової пам'яті на SQLite (better-sqlite3)
 */
export class SqliteEventRepository implements IRepository<ShortTermMemoryEvent> {
    private db: Database.Database;

    constructor(dbFilePath: string) {
        const absolutePath = path.isAbsolute(dbFilePath)
            ? dbFilePath
            : path.join(process.cwd(), dbFilePath);

        const dir = path.dirname(absolutePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.db = new Database(absolutePath);
        this.ensureSchema();
    }

    /** Закрити підключення до БД (важливо для Windows, щоб звільнити файл) */
    public close(): void {
        this.db.close();
    }

    /**
     * Ініціалізація схем таблиць
     */
    private ensureSchema(): void {
        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS short_term_memory (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT,
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_stm_session_time
        ON short_term_memory(session_id, timestamp);
    `;
        this.db.exec(createTableSQL);
    }

    private static tryStringify(value: unknown): string | null {
        try {
            return JSON.stringify(value ?? null);
        } catch {
            return null;
        }
    }

    private static safeParse(text: string | null): Record<string, unknown> {
        if (!text) return {};
        try {
            const parsed = JSON.parse(text);
            return (parsed && typeof parsed === 'object') ? (parsed as Record<string, unknown>) : {};
        } catch {
            return {};
        }
    }

    private static generateId(): string {
        // Легка генерація унікального ідентифікатора без зовнішніх залежностей
        // Використовуємо час + випадкове число в base36
        return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }

    async findById(id: string): Promise<ShortTermMemoryEvent | null> {
        const stmt = this.db.prepare<unknown[], any>(
            'SELECT id, session_id, event_type, payload, timestamp FROM short_term_memory WHERE id = ?'
        );
        const row = stmt.get(id) as
            | { id: string; session_id: string; event_type: string; payload: string | null; timestamp: number }
            | undefined;
        if (!row) return null;
        return {
            id: row.id,
            sessionId: row.session_id,
            eventType: row.event_type,
            payload: SqliteEventRepository.safeParse(row.payload),
            timestamp: row.timestamp,
        } satisfies ShortTermMemoryEvent;
    }

    async find(criteria: Partial<ShortTermMemoryEvent>): Promise<ShortTermMemoryEvent[]> {
        const where: string[] = [];
        const params: unknown[] = [];
        if (criteria.id) {
            where.push('id = ?');
            params.push(criteria.id);
        }
        if (criteria.sessionId) {
            where.push('session_id = ?');
            params.push(criteria.sessionId);
        }
        if (criteria.eventType) {
            where.push('event_type = ?');
            params.push(criteria.eventType);
        }
        if (criteria.timestamp) {
            where.push('timestamp = ?');
            params.push(criteria.timestamp);
        }

        const sql = `SELECT id, session_id, event_type, payload, timestamp FROM short_term_memory$${where.length ? ' WHERE ' + where.join(' AND ') : ''
            } ORDER BY timestamp ASC`;

        // Замінимо зайвий символ $ з шаблону (для уникнення складних escape у шаблоні)
        const finalSql = sql.replace('$', '');

        const stmt = this.db.prepare<unknown[], any>(finalSql);
        const rows = stmt.all(...params) as Array<{
            id: string;
            session_id: string;
            event_type: string;
            payload: string | null;
            timestamp: number;
        }>;
        return rows.map((row) => ({
            id: row.id,
            sessionId: row.session_id,
            eventType: row.event_type,
            payload: SqliteEventRepository.safeParse(row.payload),
            timestamp: row.timestamp,
        }));
    }

    async create(data: Omit<ShortTermMemoryEvent, 'id'>): Promise<ShortTermMemoryEvent> {
        const id = SqliteEventRepository.generateId();
        const payloadText = SqliteEventRepository.tryStringify(data.payload);
        const stmt = this.db.prepare(
            'INSERT INTO short_term_memory (id, session_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?)'
        );
        stmt.run(id, data.sessionId, data.eventType, payloadText, data.timestamp);
        return { ...data, id };
    }

    async update(id: string, data: Partial<ShortTermMemoryEvent>): Promise<ShortTermMemoryEvent | null> {
        const existing = await this.findById(id);
        if (!existing) return null;

        const updated: ShortTermMemoryEvent = {
            ...existing,
            ...data,
            // payload може бути undefined у Partial; гарантуємо збереження попереднього, якщо не передали
            payload: (data.payload ?? existing.payload) as Record<string, unknown>,
        };

        const payloadText = SqliteEventRepository.tryStringify(updated.payload);
        const stmt = this.db.prepare(
            'UPDATE short_term_memory SET session_id = ?, event_type = ?, payload = ?, timestamp = ? WHERE id = ?'
        );
        stmt.run(updated.sessionId, updated.eventType, payloadText, updated.timestamp, id);
        return updated;
    }

    async delete(id: string): Promise<boolean> {
        const stmt = this.db.prepare('DELETE FROM short_term_memory WHERE id = ?');
        const info = stmt.run(id);
        return info.changes > 0;
    }

    /**
     * Отримати останні N подій для сесії, впорядковані за часом зростання (від старих до нових)
     */
    async getLastEvents(sessionId: string, limit: number): Promise<ShortTermMemoryEvent[]> {
        const stmt = this.db.prepare(
            'SELECT id, session_id, event_type, payload, timestamp FROM short_term_memory WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?'
        );
        const rows = stmt.all(sessionId, limit) as Array<{
            id: string;
            session_id: string;
            event_type: string;
            payload: string | null;
            timestamp: number;
        }>;
        // Повернемо у зростаючому порядку часу
        return rows
            .map((row) => ({
                id: row.id,
                sessionId: row.session_id,
                eventType: row.event_type,
                payload: SqliteEventRepository.safeParse(row.payload),
                timestamp: row.timestamp,
            }))
            .sort((a, b) => a.timestamp - b.timestamp);
    }
}


