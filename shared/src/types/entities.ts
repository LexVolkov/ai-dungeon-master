export interface Player {
    id: string;
    name: string;
    sessionId: string;
}

export interface Character {
    id: string;
    playerId: string;
    name: string;
    class: string;
    stats: Record<string, number>; // наприклад: { strength: 18, dexterity: 14 }
    inventory: Array<{ itemId: string; quantity: number }>;
    hp: number;
    maxHp: number;
    // Додаткові характеристики
}

export interface Location {
    id: string;
    name: string;
    description: string;
    npcs: string[]; // Ідентифікатори NPC у цій локації
    items: Array<{ itemId: string; quantity: number }>;
    // Додаткові дані світу
}

export interface NPC {
    id: string;
    name: string;
    description: string;
    hp: number;
    maxHp: number;
    locationId: string;
    isHostile: boolean;
    // Додаткові дані NPC
}

export interface ShortTermMemoryEvent {
    id: string;
    sessionId: string;
    eventType: string;
    payload: Record<string, any>;
    timestamp: number;
}

export interface Rule {
    id: string;
    name: string;
    type: string; // наприклад: "spell", "combat", "skill_check"
    description: string;
    details: Record<string, any>; // JSON-об’єкт із деталями конкретного правила
}

export interface LoreEntry {
    id: string;
    title: string;
    content: string;
    tags: string[];
}


