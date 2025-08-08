export interface IRepository<T> {
    findById(id: string): Promise<T | null>;
    find(criteria: Partial<T>): Promise<T[]>;
    create(data: Omit<T, 'id'>): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
}

export interface VectorSearchResult {
    id: string;
    text: string;
    metadata: Record<string, any>;
    score: number;
}

export interface IVectorStore {
    add(id: string, text: string, metadata: object): Promise<void>;
    search(queryText: string, limit: number): Promise<VectorSearchResult[]>;
    delete(ids: string[]): Promise<void>;
}


