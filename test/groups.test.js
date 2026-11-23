import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    GROUP_ADDRESSING_MODES,
    isUsableGroupMetadata,
    describeUnusableGroupMetadata,
    generateParticipantHashV2,
    makeInMemoryStore,
    makeOrderedDictionary,
    ObjectRepository,
    waChatKey,
    waLabelAssociationKey
} from '../src/index.js';

test('group-metadata-exports', () => {
    assert.equal(typeof GROUP_ADDRESSING_MODES, 'object');
    assert.equal(Object.isFrozen(GROUP_ADDRESSING_MODES), true);
    assert.deepEqual([...GROUP_ADDRESSING_MODES], ['pn', 'lid']);
    assert.equal(typeof isUsableGroupMetadata, 'function');
    assert.equal(typeof describeUnusableGroupMetadata, 'function');
    assert.equal(typeof generateParticipantHashV2, 'function');
    assert.equal(typeof makeInMemoryStore, 'function');
    assert.equal(typeof makeOrderedDictionary, 'function');
    assert.equal(typeof ObjectRepository, 'function');
});

test('group-metadata-usability', () => {
    assert.equal(isUsableGroupMetadata({ participants: [], addressingMode: 'pn' }), true);
    assert.equal(isUsableGroupMetadata({ participants: [{ id: '6281@s.whatsapp.net' }], addressingMode: 'lid' }), true);
    assert.equal(isUsableGroupMetadata(null), false);
    assert.equal(isUsableGroupMetadata('grup'), false);
    assert.equal(isUsableGroupMetadata({ addressingMode: 'pn' }), false);
    assert.equal(isUsableGroupMetadata({ participants: [], addressingMode: 'pn2' }), false);

    assert.equal(describeUnusableGroupMetadata(null), 'nothing cached');
    assert.equal(describeUnusableGroupMetadata({ addressingMode: 'pn' }), 'no participants');
    assert.equal(describeUnusableGroupMetadata({ participants: [] }), 'no addressingMode');
    assert.equal(describeUnusableGroupMetadata({ participants: [], addressingMode: 'pn2' }), 'addressingMode "pn2" is not pn or lid');
});

test('group-participant-hash', () => {
    const jids = ['628111111111@s.whatsapp.net', '628222222222@s.whatsapp.net'];
    const hash = generateParticipantHashV2(jids);
    assert.equal(typeof hash, 'string');
    assert.ok(hash.length > 2);
    assert.equal(generateParticipantHashV2([...jids]), hash);
    assert.notEqual(generateParticipantHashV2([jids[0]]), hash);
});

test('group-store-helpers', () => {
    const store = makeInMemoryStore({});
    assert.equal(typeof store, 'object');
    assert.equal(typeof store.bind, 'function');
    assert.equal(typeof store.chats, 'object');
    assert.equal(typeof store.messages, 'object');
    assert.equal(typeof store.groupMetadata, 'object');
    assert.equal(typeof store.contacts, 'object');
    assert.equal(typeof store.writeToFile, 'function');

    const key = waChatKey(true);
    assert.equal(typeof key.key, 'function');
    assert.equal(typeof key.compare, 'function');
    assert.match(key.key({ id: '1203630@g.us', pinned: true, archived: false, conversationTimestamp: 10 }), /1203630@g\.us$/);
    assert.equal(typeof waLabelAssociationKey.key, 'function');

    const dictionary = makeOrderedDictionary(entry => entry.id);
    dictionary.upsert({ id: 'a' });
    assert.equal(dictionary.get('a').id, 'a');

    const repository = new ObjectRepository();
    repository.upsertById('label-1', { id: 'label-1', name: 'Penting' });
    assert.equal(repository.findById('label-1').name, 'Penting');
});
