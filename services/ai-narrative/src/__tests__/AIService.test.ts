// Тести використовують вбудований runner node:test без додаткових залежностей
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AIService } from '../AIService';
import type { LanguageModelClient } from '../clients/googleClient';

// Допоміжний мок клієнта LLM
class MockClient implements LanguageModelClient {
    constructor(private readonly responder: () => string | Promise<string>) { }
    async generate(prompt: string): Promise<string> {
        return this.responder();
    }
}

describe('AIService.generateNarrative', () => {
    it('повертає валідований об’єкт, якщо LLM повертає коректний JSON', async () => {
        const valid = JSON.stringify({
            narration: 'Герої входять до темного лісу...',
            worldChanges: [{ target: 'weather', change: 'fog intensifies' }],
            toolCalls: [{ name: 'rollCheck', arguments: { skill: 'perception', dc: 12 } }],
        });

        const service = new AIService(new MockClient(() => valid));
        const res = await service.generateNarrative('ctx');

        assert.equal(res.narration.length > 0, true);
        assert.equal(Array.isArray(res.worldChanges), true);
        assert.equal(res.toolCalls?.[0].name, 'rollCheck');
    });

    it('підтримує JSON у код-блоці', async () => {
        const fenced = '```json\n{"narration":"Тиша...","worldChanges":[]}\n```';
        const service = new AIService(new MockClient(() => fenced));
        const res = await service.generateNarrative('ctx');
        assert.equal(res.narration, 'Тиша...');
        assert.equal(res.worldChanges.length, 0);
    });

    it('кидає помилку, якщо повернено невалідний JSON', async () => {
        const invalid = 'not a json';
        const service = new AIService(new MockClient(() => invalid));
        await assert.rejects(() => service.generateNarrative('ctx'));
    });

    it('кидає помилку, якщо JSON не відповідає схемі', async () => {
        const wrong = JSON.stringify({
            text: 'no narration field here',
        });
        const service = new AIService(new MockClient(() => wrong));
        await assert.rejects(() => service.generateNarrative('ctx'));
    });
});


