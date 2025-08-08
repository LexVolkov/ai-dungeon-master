# 7. Довідник з API та Подій

Цей документ описує ключові API-контракти та події, що циркулюють у системі через RabbitMQ.

## Взаємодія з LLM

### 1. Структурована відповідь (JSON)

Використовується для генерації творчого контенту. `ai-narrative-service` використовує `response_format: { type: "json_object" }` та схему на Zod для валідації.

**Приклад схеми відповіді (Zod):**
```typescript
const NarrativeResponseSchema = z.object({
  narration: z.string(),
  worldChanges: z.array(z.object({
    target: z.string(),
    change: z.string()
  })),
  mood: z.string().optional()
});
```

### 2. Виклик Інструментів (Tool Calls)

Використовується, коли LLM потрібно виконати дію, що змінює світ. LLM не змінює стан безпосередньо, а запитує виклик функції у `game-engine`.

**Приклад запиту від LLM:**
```json
{
  "tool_calls": [{
    "name": "resolve_attack",
    "arguments": { "attacker_id": "aragorn_1", "target_id": "goblin_1" }
  }]
}
```

## Схеми Баз Даних (SQLite / PostgreSQL)

**Таблиця персонажів:**
```sql
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    player_id TEXT,
    name TEXT NOT NULL,
    class TEXT,
    stats TEXT -- JSON-рядок
);
```

**Короткострокова пам'ять:**
```sql
CREATE TABLE IF NOT EXISTS short_term_memory (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT, -- JSON-рядок
    timestamp INTEGER NOT NULL
);
```

## Метадані для Векторів (ChromaDB)

Кожен стиснутий спогад у ChromaDB має наступні метадані для фільтрації:

```json
{
  "sessionId": "session_alpha_123",
  "type": "compressed_summary",
  "timestamp_start": 1678886400,
  "timestamp_end": 1678887000,
  "involved_players": ["player_1", "player_2"]
}
```