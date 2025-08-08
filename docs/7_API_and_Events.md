# 7. Справочник по API и Событиям

Этот документ описывает ключевые API-контракты и события, циркулирующие в системе через RabbitMQ.

## Взаимодействие с LLM

### 1. Структурированный ответ (JSON)

Используется для генерации творческого контента. `ai-narrative-service` использует `response_format: { type: "json_object" }` и схему на Zod для валидации.

**Пример схемы ответа (Zod):**
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

### 2. Вызов Инструментов (Tool Calls)

Используется, когда LLM нужно выполнить действие, изменяющее мир. LLM не меняет состояние напрямую, а запрашивает вызов функции у `game-engine`.

**Пример запроса от LLM:**
```json
{
  "tool_calls": [{
    "name": "resolve_attack",
    "arguments": { "attacker_id": "aragorn_1", "target_id": "goblin_1" }
  }]
}
```

## Схемы Баз Данных (SQLite / PostgreSQL)

**Таблица персонажей:**
```sql
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    player_id TEXT,
    name TEXT NOT NULL,
    class TEXT,
    stats TEXT -- JSON-строка
);
```

**Краткосрочная память:**
```sql
CREATE TABLE IF NOT EXISTS short_term_memory (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT, -- JSON-строка
    timestamp INTEGER NOT NULL
);
```

## Метаданные для Векторов (ChromaDB)

Каждое сжатое воспоминание в ChromaDB имеет следующие метаданные для фильтрации:

```json
{
  "sessionId": "session_alpha_123",
  "type": "compressed_summary",
  "timestamp_start": 1678886400,
  "timestamp_end": 1678887000,
  "involved_players": ["player_1", "player_2"]
}
```