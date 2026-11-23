import { test } from 'node:test';
import assert from 'node:assert/strict';
import EventEmitter from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import makeWASocket, {
    BRAND,
    printBrand,
    getBrandLines,
    attachAutoFollow,
    normalizeAutoFollow,
    AUTO_FOLLOW_NEWSLETTER_JID,
    makeInMemoryStore,
    captureEventStream,
    readAndEmitEventStream,
    queueJob,
    getBotJid,
    extractNewsletterMetadata,
    waMessageID,
    makeOrderedDictionary,
    ObjectRepository
} from '../src/index.js';

test('runtime-exports', () => {
    assert.equal(typeof makeWASocket, 'function');
    assert.equal(typeof attachAutoFollow, 'function');
    assert.equal(typeof normalizeAutoFollow, 'function');
    assert.equal(typeof makeInMemoryStore, 'function');
    assert.equal(typeof captureEventStream, 'function');
    assert.equal(typeof readAndEmitEventStream, 'function');
    assert.equal(typeof queueJob, 'function');
    assert.equal(typeof printBrand, 'function');
    assert.equal(typeof getBrandLines, 'function');
    assert.equal(typeof BRAND, 'object');
    assert.equal(Object.isFrozen(BRAND), true);
    assert.equal(typeof AUTO_FOLLOW_NEWSLETTER_JID, 'string');
});

test('runtime-brand', () => {
    assert.equal(BRAND.name, 'REIN BAILEYS');
    assert.equal(BRAND.shortName, 'REIN');
    assert.equal(typeof BRAND.version, 'string');
    assert.equal(BRAND.palette.length, 3);
    assert.equal(typeof BRAND.boxWidth, 'number');
    const lines = getBrandLines();
    assert.equal(lines.length, 6);
    assert.ok(lines.some(line => line.includes('R E I N   B A I L E Y S')));
    assert.equal(typeof printBrand(), 'boolean');
});

test('runtime-auto-follow', () => {
    assert.equal(AUTO_FOLLOW_NEWSLETTER_JID, '120363406952188879@newsletter');
    assert.equal(normalizeAutoFollow(false).enabled, false);
    assert.equal(normalizeAutoFollow(true).jid, AUTO_FOLLOW_NEWSLETTER_JID);
    assert.equal(normalizeAutoFollow('123@newsletter').jid, '123@newsletter');
    assert.equal(normalizeAutoFollow({ enabled: false, delayMs: 20 }).delayMs, 20);
    assert.equal(normalizeAutoFollow({}).react, true);

    const sock = { ev: new EventEmitter() };
    const dispose = attachAutoFollow(sock, { autoFollow: false });
    assert.equal(typeof dispose, 'function');
    assert.equal(sock.ev.listenerCount('connection.update'), 0);
    dispose();
    assert.equal(typeof attachAutoFollow({}, {}), 'function');
});

test('runtime-queue-job', async () => {
    const order = [];
    const first = queueJob('runtime-test', async () => {
        order.push('first');
        return 1;
    });
    const second = queueJob('runtime-test', async () => {
        order.push('second');
        return 2;
    });
    assert.deepEqual(await Promise.all([first, second]), [1, 2]);
    assert.deepEqual(order, ['first', 'second']);
    await assert.rejects(() => queueJob(() => { throw new TypeError('bad task'); }), TypeError);
});

test('runtime-event-stream', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rein-runtime-'));
    const filename = join(dir, 'events.jsonl');
    const ev = new EventEmitter();
    const original = ev.emit;
    const seen = [];
    ev.on('probe', value => seen.push(value));
    captureEventStream(ev, filename);
    assert.notEqual(ev.emit, original);
    ev.emit('probe', 7);
    assert.deepEqual(seen, [7]);
    await new Promise(resolve => setTimeout(resolve, 30));
    const lines = readFileSync(filename, 'utf8').trim().split('\n').filter(Boolean);
    ev.emit = original;
    rmSync(dir, { recursive: true, force: true });
    assert.equal(lines.length, 1);
    assert.deepEqual(JSON.parse(lines[0]).event, 'probe');
    assert.deepEqual(JSON.parse(lines[0]).data, 7);
});

test('runtime-store-and-compat', () => {
    const store = makeInMemoryStore({});
    assert.equal(typeof store.bind, 'function');
    assert.equal(typeof store.chats, 'object');
    assert.equal(typeof store.messages, 'object');
    assert.equal(typeof store.groupMetadata, 'object');
    assert.equal(typeof makeOrderedDictionary, 'function');
    assert.equal(typeof ObjectRepository, 'function');
    assert.equal(typeof waMessageID, 'function');
    assert.equal(getBotJid('867051314767696@bot'), '13135550002@s.whatsapp.net');
    assert.equal(getBotJid('628111111111@s.whatsapp.net'), '628111111111@s.whatsapp.net');
    assert.equal(extractNewsletterMetadata({ tag: 'iq', attrs: {} }), undefined);
});
