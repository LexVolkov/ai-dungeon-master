# 2. Обзор Архитектуры

Система представляет собой набор независимых микросервисов, взаимодействующих асинхронно через центральную шину событий (RabbitMQ). Это исключает прямые зависимости и "спагетти-код".

### Схема Высокого Уровня

```
"Клиентская часть"
    Frontend[React App]
        ^
        | HTTP/WebSocket
        v
"Backend Инфраструктура"
    Gateway[API Gateway / WebSocket] <--> Bus[RabbitMQ]

"Игровые Сервисы" (Все подключены к RabbitMQ)
    - Engine[Game Engine]
    - World[World Service]
    - Player[Player Service]
    - AI[AI Narrative Service]
    - Memory[Memory Service]
    - KBS[Knowledge Base Service]

"Базы Данных"
    - SQLite (Player, World, Short-Term Memory)
    - ChromaDB (Vector Memory, Knowledge Base)
```

### Детальное Описание Компонентов

*   **API Gateway (`api-gateway`):** Единая точка входа для клиентов. Управляет WebSocket-соединениями, аутентифицирует пользователей и публикует их действия в шину событий.
*   **RabbitMQ (`rabbitmq`):** Центральная шина событий. Обеспечивает асинхронную коммуникацию между всеми сервисами по принципу "публикация-подписка".
*   **Game Engine (`game-engine`):** Оркестратор игрового процесса. Не содержит бизнес-логики, а координирует запросы к другим сервисам в правильной последовательности.
*   **Player Service (`player-service`):** Управляет данными игроков и их персонажей (профили, инвентарь, характеристики).
*   **World Service (`world-service`):** Управляет состоянием игрового мира (локации, NPC, игровое время).
*   **AI Narrative Service (`ai-narrative`):** Мозг ИИ. Генерирует описания, диалоги и сюжетные повороты, используя LLM (OpenAI/Anthropic). Возвращает ответ в строго структурированном JSON.
*   **Memory Service (`memory-service`):** Решает проблему "амнезии" ИИ. Хранит краткосрочную память (последние события в SQLite) и долговременную (сжатые резюме в ChromaDB).
*   **Knowledge Base Service (`kbs`):** Хранилище "истинных" знаний: правила игры, лор мира, кастомные механики. Предоставляет точный контекст для ИИ, предотвращая галлюцинации.

### Поток Данных: Атака Игрока

sequenceDiagram
    participant User
    participant Frontend
    participant Gateway
    participant Bus
    participant Engine
    participant KBS
    participant Memory
    participant AI

    User->>Frontend: "Я атакую гоблина!"
    Frontend->>Gateway: emit('player_action')
    Gateway->>Bus: publish('player.action')

    Bus-->>Engine: deliver('player.action')
    Engine->>Bus: publish('kbs.get_rule', {rule: "attack"})
    Bus-->>KBS: deliver('kbs.get_rule')
    KBS-->>Bus: publish('rule_response', {details})

    Bus-->>Engine: deliver('rule_response')
    Engine->>Bus: publish('memory.get_context')
    Bus-->>Memory: deliver('memory.get_context')
    Memory-->>Bus: publish('context_response', {context})
    
    Bus-->>Engine: deliver('context_response')
    Engine->>Bus: publish('ai.generate_narrative', {context, rules})
    Bus-->>AI: deliver('ai.generate_narrative')
    AI-->>Bus: publish('narrative_response', {narration, tool_calls})

    Bus-->>Engine: deliver('narrative_response')
    Engine->>Engine: (Выполняет tool_calls, обновляет мир через World/Player Service)
    Engine->>Bus: publish('game.update', {final_narrative})
    
    Bus-->>Gateway: deliver('game.update')
    Gateway->>Frontend: emit('narrative_update')
    Frontend->>User: "Ваш меч вонзается в гоблина!"