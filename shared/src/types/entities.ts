export interface Player {
    /** Унікальний ідентифікатор гравця */
    id: string;
    /** Відображуване ім'я гравця */
    name: string;
    /** Поточна сесія гравця */
    sessionId: string;
}

export interface Character {
    /** Ідентифікатор персонажа */
    id: string;
    /** Власник персонажа */
    playerId: string;
    /** Ім'я персонажа */
    name: string;
    /** Клас/архетип */
    class: string;
    /** Характеристики, наприклад: { strength: 18, dexterity: 14 } */
    stats: Record<string, number>;
    /** Інвентар предметів */
    inventory: Array<{ itemId: string; quantity: number }>;
    /** Поточне здоров'я */
    hp: number;
    /** Максимальне здоров'я */
    maxHp: number;
}

export interface Location {
    /** Ідентифікатор локації */
    id: string;
    /** Назва локації */
    name: string;
    /** Опис локації */
    description: string;
    /** Ідентифікатори NPC у цій локації */
    npcs: string[];
    /** Предмети, що знаходяться в локації */
    items: Array<{ itemId: string; quantity: number }>;
}

export interface NPC {
    /** Ідентифікатор NPC */
    id: string;
    /** Ім'я */
    name: string;
    /** Короткий опис */
    description: string;
    /** Поточне HP */
    hp: number;
    /** Максимальне HP */
    maxHp: number;
    /** Поточна локація NPC */
    locationId: string;
    /** Агресивний/ворожий стан */
    isHostile: boolean;
}

export interface ShortTermMemoryEvent {
    /** Ідентифікатор запису пам'яті */
    id: string;
    /** Сесія, до якої належить подія */
    sessionId: string;
    /** Тип події */
    eventType: string;
    /** Дані події */
    payload: Record<string, unknown>;
    /** Час, мс */
    timestamp: number;
}

export interface Rule {
    /** Ідентифікатор правила */
    id: string;
    /** Назва правила */
    name: string;
    /** Тип: наприклад, "spell", "combat", "skill_check" */
    type: string;
    /** Опис правила */
    description: string;
    /** Додаткові параметри правила */
    details: Record<string, unknown>;
}

export interface LoreEntry {
    /** Ідентифікатор запису */
    id: string;
    /** Заголовок */
    title: string;
    /** Вміст */
    content: string;
    /** Теги для фільтрації */
    tags: string[];
}


