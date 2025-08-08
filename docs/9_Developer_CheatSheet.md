# 9. Developer Cheat Sheet

Короткий довідник для швидкого орієнтування по монорепозиторію та правилах використання модулів.

## Структура проєкту (Monorepo Workspaces)

- Корінь:
  - `package.json`: скрипти `dev`, `lint`, `format`, робочі простори (`workspaces`).
  - `tsconfig.base.json`: базова конфігурація TypeScript, alias `@shared/*`, `@shared/module`.
  - `docs/`: архітектура, події, типи, гайд для девів (цей файл).
- Пакети:
  - `shared/`: спільні типи, інтерфейси, утиліти. Пакет `@shared/module` (private).
  - `services/*`: мікросервіси (api-gateway, game-engine, ai-narrative, memory, player, world, knowledge-base, rabbitmq).
  - `frontend/`: клієнтський застосунок (Vite + React).

## Запуск і розробка

- Запустити всі сервіси та фронтенд:
  ```bash
  npm run dev
  ```
- Перевірка стилю та форматування:
  ```bash
  npm run lint
  npm run lint:fix
  npm run format
  npm run format:check
  ```
- Збірка окремого пакета:
  ```bash
  npm run -w shared build
  npm run -w services/game-engine build
  npm run -w frontend build
  ```

## TypeScript та імпорти

- Глобальний `tsconfig.base.json` визначає alias:
  - `@shared/module` → `shared/src/index.ts`
  - `@shared/*` → `shared/src/*`
- Приклади імпорту:
  ```ts
  import { Player, IRepository, PlayerActionPayload } from '@shared/module';
  import { Character } from '@shared/types/entities';
  ```

## Модуль `shared`

- Вхідна точка: `shared/src/index.ts` (експортує типи та інтерфейси).
- Типи сутностей: `shared/src/types/entities.ts` (Player, Character, Location, NPC, Rule, тощо).
- Типи подій: `shared/src/types/events.ts` (PlayerActionPayload, GameUpdatePayload, ...).
- Інтерфейси доступу до даних: `shared/src/interfaces/repository.ts` (`IRepository<T>`, `IVectorStore`).
- Документація типів: `docs/8_Shared_Types.md`.

Як додати новий тип/подію:
1) Додайте/оновіть інтерфейси в `shared/src/types/*`. 2) Перегенеруйте `shared`:
```bash
npm run -w shared build
```
3) За потреби оновіть `docs/8_Shared_Types.md`.

## Архітектурні принципи (обов’язкові)

- Взаємодія між сервісами лише через RabbitMQ (асинхронні події). Без прямих HTTP-викликів.
- `game-engine`: оркестратор подій. Отримує подію → координує сервіси → публікує фінальне оновлення.
- Сервіси мають чітку відповідальність (api-gateway, ai-narrative, memory, world, player, knowledge-base, rabbitmq).
- Стан сервісів — іммутабельний ззовні: зміни стану світу тільки після `world.change` від `game-engine`.

## Події та контракти

- Всі пейлоади подій описані у `shared/src/types/events.ts` та дубльовані в `docs/7_API_and_Events.md` (приклади).
- Дотримуйтесь строгих типів з `@shared/module`; не використовуйте `any` (використовуйте `unknown` або конкретні типи).

## Патерн Репозиторію

- Інтерфейс: `IRepository<T>` у `shared/src/interfaces/repository.ts`.
- Рекомендації:
  - Реалізації зберігайте у відповідному сервісі (`services/<name>/src/repositories/*`).
  - Дотримуйтесь SRP: одна реалізація — один тип сутності/сховища.
  - Для векторного пошуку використовуйте `IVectorStore`.

## Додавання нового сервісу (швидкий гайд)

1) Створіть папку `services/<new-service>/` з `package.json` за зразком існуючих (скрипти `dev`, `build`).
2) Додайте `tsconfig.json`, який наслідує `../../tsconfig.base.json` і має `rootDir: src`, `outDir: dist`.
3) Додайте залежність на `@shared/module` у `dependencies`.
4) Додайте сервіc у кореневий скрипт `dev` (якщо потрібно запускати разом з усіма).

## Тести

- Приклад є у `services/ai-narrative/src/__tests__/AIService.test.ts` (запуск через `npm run -w services/ai-narrative test`).
- Рекомендується розміщувати тести у `src/__tests__` поруч із кодом пакета.

## Локальне налагодження імпортів

- Якщо IDE не підхоплює alias, переконайтесь, що пакет `shared` зібраний (`npm run -w shared build`).
- Для типів під час розробки покладайтесь на шляхи з `tsconfig.base.json` (`paths`).

## Поширені команди

```bash
# Запустити все
npm run dev

# Зібрати спільний модуль
npm run -w shared build

# Лінт і формат
npm run lint
npm run format
```

## Memory Service: короткострокова пам'ять (SQLite)

- Схема таблиці `short_term_memory` створюється автоматично при старті репозиторію (`better-sqlite3`).
- Репозиторій: `services/memory-service/src/repositories/SqliteEventRepository.ts` (реалізує `IRepository<ShortTermMemoryEvent>` + `getLastEvents`).
- Менеджер: `services/memory-service/src/MemoryManager.ts` (`saveEvent`, `buildContext`).
- Конфіг через env:
  - `MEMORY_DB_PATH` — шлях до SQLite (`data/memory/short_term_memory.sqlite` за замовч.)
  - `MEMORY_DEFAULT_CONTEXT_LIMIT` — дефолтний ліміт подій у контексті (за замовч. 20)
  - `PORT` — порт локального smoke-сервера (лише для розробки)

### Тести

```bash
# Запустити тести memory-service
npm run -w services/memory-service test
```

Тестовий файл: `services/memory-service/src/__tests__/MemoryManager.test.ts` (node:test). Перевіряє:
- збереження події та генерацію текстового контексту;
- повернення останніх N подій у хронологічному порядку.



## Зовнішні залежності (Docker Compose)

- **Файл**: `docker-compose.yml` у корені репозиторію.
- **Сервіси**:
  - **RabbitMQ**: порти `5672` (AMQP), `15672` (Management UI)
  - **ChromaDB**: порт `8000` (HTTP API)

### Запуск та керування

```bash
# Запустити зовнішні залежності у бекграунді
docker compose up -d

# Перевірити статус
docker compose ps

# Дивитися логи конкретного сервісу
docker compose logs rabbitmq -f
docker compose logs chromadb -f

# Зупинити та прибрати ресурси (мережі/контейнери, але томи залишаться)
docker compose down
```

### Доступ і підключення

- **RabbitMQ UI**: `http://localhost:15672`
  - логін/пароль: `ai` / `ai_pass`
- **Рядки підключення**:
  - AMQP: `amqp://ai:ai_pass@localhost:5672`
  - ChromaDB HTTP: `http://localhost:8000`

Примітка: дані зберігаються у персистентних томах (`rabbitmq-data`, `chroma-data`), мережа — `ai-network`. RabbitMQ має вбудований healthcheck.
