# 2. Огляд Архітектури

Система є набором незалежних мікросервісів, що асинхронно взаємодіють через центральну шину подій (RabbitMQ). Це виключає прямі залежності та "спагетті-код".

### Високорівнева Схема

```
"Клієнтська частина"
    Frontend[React App]
        ^
        | HTTP/WebSocket
        v
"Backend Інфраструктура"
    Gateway[API Gateway / WebSocket] <--> Bus[RabbitMQ]

"Ігрові Сервіси" (Всі підключені до RabbitMQ)
    - Engine[Game Engine]
    - World[World Service]
    - Player[Player Service]
    - AI[AI Narrative Service]
    - Memory[Memory Service]
    - KBS[Knowledge Base Service]

"Бази Даних"
    - SQLite (Player, World, Short-Term Memory)
    - ChromaDB (Vector Memory, Knowledge Base)
```

### Детальний Опис Компонентів

*   **API Gateway (`api-gateway`):** Єдина точка входу для клієнтів. Керує WebSocket-з'єднаннями, автентифікує користувачів і публікує їхні дії в шину подій.
*   **RabbitMQ (`rabbitmq`):** Центральна шина подій. Забезпечує асинхронну комунікацію між усіма сервісами за принципом "публікація-підписка".
*   **Game Engine (`game-engine`):** Оркестратор ігрового процесу. Не містить бізнес-логіки, а координує запити до інших сервісів у правильній послідовності.
*   **Player Service (`player-service`):** Керує даними гравців та їхніх персонажів (профілі, інвентар, характеристики).
*   **World Service (`world-service`):** Керує станом ігрового світу (локації, NPC, ігровий час).
*   **AI Narrative Service (`ai-narrative`):** Мозок ШІ. Генерує описи, діалоги та сюжетні повороти, використовуючи LLM (OpenAI/Anthropic). Повертає відповідь у строго структурованому JSON.
*   **Memory Service (`memory-service`):** Вирішує проблему "амнезії" ШІ. Зберігає короткострокову пам'ять (останні події в SQLite) і довгострокову (стислі резюме в ChromaDB).
*   **Knowledge Base Service (`kbs`):** Сховище "істинних" знань: правила гри, лор світу, кастомні механіки. Надає точний контекст для ШІ, запобігаючи галюцинаціям.

### Потік Даних: Атака Гравця

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Gateway
    participant Bus
    participant Engine
    participant KBS
    participant Memory
    participant AI

    User->>Frontend: "Я атакую гобліна!"
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
    Engine->>Engine: (Виконує tool_calls, оновлює світ через World/Player Service)
    Engine->>Bus: publish('game.update', {final_narrative})
    
    Bus-->>Gateway: deliver('game.update')
    Gateway->>Frontend: emit('narrative_update')
    Frontend->>User: "Ваш меч вонзається в гобліна!"
```