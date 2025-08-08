// Тести використовують вбудований runner node:test без додаткових залежностей
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryManager } from '../MemoryManager';
import { SqliteEventRepository } from '../repositories/SqliteEventRepository';
import path from 'node:path';
import fs from 'node:fs';

const TMP_DB_DIR = path.join(process.cwd(), 'tmp-tests');

describe('MemoryManager', () => {
    const sessionId = 'test_session_1';
    let dbPath: string;
    let repo: SqliteEventRepository | null = null;

    beforeEach(() => {
        if (!fs.existsSync(TMP_DB_DIR)) fs.mkdirSync(TMP_DB_DIR, { recursive: true });
        dbPath = path.join(TMP_DB_DIR, `stm_${Date.now()}_${Math.random().toString(36).slice(2)}.sqlite`);
        if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { force: true });
    });

    afterEach(() => {
        if (repo) {
            repo.close();
            repo = null;
        }
        if (fs.existsSync(dbPath)) {
            try {
                fs.rmSync(dbPath, { force: true });
            } catch {
                // ігноруємо помилки видалення у Windows, якщо файл ще зайнятий, бо ми вже закрили з'єднання
            }
        }
    });

    it('зберігає подію та повертає її у контексті', async () => {
        repo = new SqliteEventRepository(dbPath);
        const manager = new MemoryManager(repo, { defaultContextLimit: 10 });

        const now = Date.now();
        await manager.saveEvent({
            sessionId,
            eventType: 'player.action',
            payload: { action: 'say', text: 'Hello' },
            timestamp: now,
        });

        const context = await manager.buildContext(sessionId, 5);
        assert.equal(typeof context, 'string');
        assert.equal(context.includes('player.action'), true);
        assert.equal(context.includes('Hello'), true);
    });

    it('повертає останні N подій у хронологічному порядку', async () => {
        repo = new SqliteEventRepository(dbPath);
        const manager = new MemoryManager(repo, { defaultContextLimit: 10 });

        const t0 = Date.now();
        await manager.saveEvent({ sessionId, eventType: 'e1', payload: { i: 1 }, timestamp: t0 });
        await manager.saveEvent({ sessionId, eventType: 'e2', payload: { i: 2 }, timestamp: t0 + 10 });
        await manager.saveEvent({ sessionId, eventType: 'e3', payload: { i: 3 }, timestamp: t0 + 20 });

        const context2 = await manager.buildContext(sessionId, 2);
        const lines = context2.split('\n');
        assert.equal(lines.length, 2);
        // очікуємо e2, потім e3
        assert.equal(lines[0].includes('(e2)'), true);
        assert.equal(lines[1].includes('(e3)'), true);
    });
});


