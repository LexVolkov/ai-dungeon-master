# 8. Shared: Типи та Інтерфейси

Цей документ описує ключові типи та інтерфейси, що експортуються з пакета `@shared/module` і використовуються сервісами проєкту.

## Базові сутності (`shared/src/types/entities.ts`)

- **Player**: гравець сесії.
  - `id: string` — унікальний ідентифікатор гравця.
  - `name: string` — відображуване ім’я.
  - `sessionId: string` — ідентифікатор активної сесії.

- **Character**: ігровий персонаж, прив’язаний до гравця.
  - `id: string`, `playerId: string`, `name: string`, `class: string`
  - `stats: Record<string, number>` — числові характеристики.
  - `inventory: Array<{ itemId: string; quantity: number }>` — інвентар.
  - `hp: number`, `maxHp: number` — здоров’я.

- **Location**: ігрова локація з NPC та предметами.
- **NPC**: неігровий персонаж із параметрами бою/поведінки.
- **ShortTermMemoryEvent**: подія для короткострокової пам’яті.
- **Rule**: запис довідника правил.
- **LoreEntry**: запис енциклопедії сеттингу.

## Події (`shared/src/types/events.ts`)

Усі події містять `sessionId` у базовому типі `EventPayload`.

- **PlayerActionPayload**: дія гравця.
  - `action: string`, `playerId: string`, `characterId: string`.

- **GameUpdatePayload**: оновлення гри для клієнта.
  - `narrative: string`
  - `worldChanges?: Array<{ target: string; change: string }>`
  - `characterUpdates?: Array<{ characterId: string; updates: Record<string, any> }>`

- **AiGenerateNarrativePayload**: запит до LLM із `context: string`.
- **MemoryGetContextPayload**: запит за контекстом, опційно `characterId`.
- **ContextResponsePayload**: відповідь із рядком контексту.
- **NarrativeResponsePayload**: згенерована нарація та запропоновані зміни світу.
- **WorldChangePayload**: пакет змін у світі.
- **RuleDetailsPayload**: запит деталей правила.

## Репозиторії та векторне сховище (`shared/src/interfaces/repository.ts`)

- **IRepository<T>**: базові CRUD-операції.
  - `findById`, `find`, `create`, `update`, `delete`.

- **IVectorStore**: робота з векторним індексом.
  - `add(id, text, metadata)` — додати документ.
  - `search(queryText, limit)` — пошук подібних текстів.
  - `delete(ids)` — видалення документів за ідентифікаторами.

- **VectorSearchResult**: результат пошуку з `score`.

## Використання

- Імпортуйте з пакета:

```ts
import { Player, IRepository, PlayerActionPayload } from '@shared/module';
```

Пакет позначено як приватний (`"private": true`) і використовується як workspace-пакет локально.
