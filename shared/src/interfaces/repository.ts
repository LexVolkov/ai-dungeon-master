export interface IRepository<T> {
    /** Знайти сутність за її ідентифікатором */
    findById(id: string): Promise<T | null>;
    /** Знайти всі сутності, що відповідають критеріям */
    find(criteria: Partial<T>): Promise<T[]>;
    /** Створити нову сутність */
    create(data: Omit<T, 'id'>): Promise<T>;
    /** Оновити частину полів сутності */
    update(id: string, data: Partial<T>): Promise<T | null>;
    /** Видалити сутність за ідентифікатором */
    delete(id: string): Promise<boolean>;
}

export interface VectorSearchResult {
    /** Ідентифікатор документа у векторному сховищі */
    id: string;
    /** Текст документа */
    text: string;
    /** Додаткові метадані */
    metadata: Record<string, unknown>;
    /** Оцінка подібності (чим вище, тим більш релевантно) */
    score: number;
}

export interface IVectorStore {
    /** Додати документ у векторне сховище */
    add(id: string, text: string, metadata: Record<string, unknown>): Promise<void>;
    /** Пошук документів за текстовим запитом */
    search(queryText: string, limit: number): Promise<VectorSearchResult[]>;
    /** Видалити документи за їх ідентифікаторами */
    delete(ids: string[]): Promise<void>;
}


