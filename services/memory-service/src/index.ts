import 'dotenv/config';
import path from 'node:path';
import { MemoryManager } from './MemoryManager';
import { SqliteEventRepository } from './repositories/SqliteEventRepository';

// Налаштування шляхів та значень за замовчуванням
const DB_FILE = process.env.MEMORY_DB_PATH || path.join('data', 'memory', 'short_term_memory.sqlite');
const DEFAULT_LIMIT = Number(process.env.MEMORY_DEFAULT_CONTEXT_LIMIT || 20);

// Ініціалізація інфраструктури
const repository = new SqliteEventRepository(DB_FILE);
const memoryManager = new MemoryManager(repository, { defaultContextLimit: DEFAULT_LIMIT });

// УВАГА: У фінальній версії ми повинні підключитись до RabbitMQ і слухати події
// Тут залишимо мінімальний HTTP для smoke-тесту (не використовується для міжсервісної комунікації)
import express from 'express';
const app = express();
app.use(express.json());

// Ендпоінт для локального тесту збереження події
app.post('/event', async (req, res) => {
    try {
        const { sessionId, eventType, payload, timestamp } = req.body || {};
        if (!sessionId || !eventType) {
            return res.status(400).json({ error: 'sessionId та eventType є обов\'язковими' });
        }
        const ts = typeof timestamp === 'number' ? timestamp : Date.now();
        const created = await memoryManager.saveEvent({ sessionId, eventType, payload: payload ?? {}, timestamp: ts });
        res.json(created);
    } catch (e) {
        // Коментарі українською згідно з правилами
        res.status(500).json({ error: (e as Error).message });
    }
});

// Ендпоінт для локального тесту побудови контексту
app.get('/context/:sessionId', async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const context = await memoryManager.buildContext(req.params.sessionId, limit);
        res.type('text/plain').send(context);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

const PORT = Number(process.env.PORT || 4005);
app.listen(PORT, () => {
    // Локальний запуск для верифікації
    // У продакшені тут має бути підключення до RabbitMQ
    console.log(`[memory-service] listening on :${PORT}, db=${DB_FILE}, defaultLimit=${DEFAULT_LIMIT}`);
});

export { memoryManager };


