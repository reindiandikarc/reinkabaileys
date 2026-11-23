import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    generateWAMessage,
    generateWAMessageContent,
    generateWAMessageFromContent,
    normalizeMessageContent,
    extractMessageContent,
    prepareWAMessageMedia,
    generateMessageID,
    generateMessageIDV2,
    waMessageID,
    updateMessageWithReaction,
    getAggregateVotesInPollMessage,
    makeQuestionMessage,
    makeQuestionResponseMessage,
    makePollAddOptionMessage,
    makeEventInviteMessage,
    makeCommentMessage,
    prepareModernMessageContent,
    STATUS_AUDIENCE_DEFAULT_LIST_NAME,
    STATUS_AUDIENCE_DEFAULT_EMOJI
} from '../src/index.js';

const JID = '628111111111@s.whatsapp.net';

test('message-exports', () => {
    for (const value of [
        generateWAMessage,
        generateWAMessageContent,
        generateWAMessageFromContent,
        normalizeMessageContent,
        extractMessageContent,
        prepareWAMessageMedia,
        generateMessageID,
        generateMessageIDV2,
        waMessageID,
        updateMessageWithReaction,
        getAggregateVotesInPollMessage,
        makeQuestionMessage,
        makeQuestionResponseMessage,
        makePollAddOptionMessage,
        makeEventInviteMessage,
        makeCommentMessage,
        prepareModernMessageContent
    ]) {
        assert.equal(typeof value, 'function');
    }
});

test('message-generate-wa-message', async () => {
    const result = await generateWAMessage(JID, { text: 'halo' }, { messageId: 'MSG-1' });
    assert.equal(result.key.remoteJid, JID);
    assert.equal(result.key.id, 'MSG-1');
    assert.equal(result.message.extendedTextMessage.text, 'halo');
    assert.ok(result.messageTimestamp);

    const generated = await generateWAMessageContent({ text: 'isi' }, {});
    assert.equal(normalizeMessageContent(generated).extendedTextMessage.text, 'isi');
});

test('message-normalize-and-from-content', () => {
    assert.deepEqual(normalizeMessageContent({ conversation: 'halo' }), { conversation: 'halo' });
    assert.deepEqual(extractMessageContent({ conversation: 'halo' }), { conversation: 'halo' });

    const message = generateWAMessageFromContent(JID, { conversation: 'dari konten' }, { messageId: 'MSG-2' });
    assert.equal(message.key.id, 'MSG-2');
    assert.equal(message.message.conversation, 'dari konten');
});

test('message-modern-builders', () => {
    assert.deepEqual(makeQuestionMessage({ text: 'Pertanyaan?' }).questionMessage.message.extendedTextMessage.text, 'Pertanyaan?');
    assert.equal(makeQuestionMessage({ text: 'Q' }).questionMessage.message.extendedTextMessage.contextInfo.isQuestion, true);
    assert.throws(() => makeQuestionMessage({}), TypeError);

    assert.equal(makeQuestionResponseMessage({ key: { id: 'K1' }, text: 'Jawaban' }).questionResponseMessage.text, 'Jawaban');
    assert.throws(() => makeQuestionResponseMessage({ key: {} }), /key\.id is required/);

    const poll = makePollAddOptionMessage({ pollCreationMessageKey: { id: 'POLL-1' }, option: 'A' });
    assert.deepEqual(poll.pollAddOptionMessage.addOption, { optionName: 'A' });
    assert.equal(poll.pollAddOptionMessage.pollCreationMessageKey.id, 'POLL-1');
    assert.throws(() => makePollAddOptionMessage({ option: 'A' }), /pollCreationMessageKey must be an object/);

    const event = makeEventInviteMessage({ eventId: 'EVT-1', eventTitle: 'Rapat', startTime: 1700000000 });
    assert.equal(event.eventInviteMessage.eventId, 'EVT-1');
    assert.equal(event.eventInviteMessage.eventTitle, 'Rapat');
    assert.throws(() => makeEventInviteMessage({}), /eventId is required/);

    const comment = makeCommentMessage({ targetMessageKey: { id: 'K1' }, content: { text: 'komentar' } });
    assert.equal(comment.commentMessage.message.extendedTextMessage.text, 'komentar');
    assert.equal(comment.commentMessage.targetMessageKey.id, 'K1');
});

test('message-ids-and-reactions', () => {
    assert.equal(typeof generateMessageID(), 'string');
    assert.equal(generateMessageIDV2().length, 22);
    assert.equal(waMessageID({ key: { id: 'ABC' } }), 'ABC');

    const message = { key: { id: 'K1', remoteJid: JID } };
    updateMessageWithReaction(message, { text: '\u2764\ufe0f' }, '628222222222@s.whatsapp.net');
    assert.equal(Array.isArray(message.reactions), true);

    const votes = getAggregateVotesInPollMessage({
        message: { pollCreationMessage: { name: 'Pilihan', options: [{ optionName: 'A' }] } }
    }, []);
    assert.deepEqual(votes, [{ name: 'A', voters: [] }]);
});

test('message-prepare-modern-content', () => {
    const prepared = prepareModernMessageContent({
        text: 'halo',
        statusAudience: { listName: 'Besties', listEmoji: '\ud83d\udc9c' }
    });
    assert.equal(prepared.contextInfo.statusAudienceMetadata.listName, 'Besties');
    assert.equal(prepared.contextInfo.statusAudienceMetadata.listEmoji, '\ud83d\udc9c');
    assert.equal(prepared.contextInfo.statusAudienceMetadata.audienceType, 1);
    assert.equal(STATUS_AUDIENCE_DEFAULT_LIST_NAME, 'Close friends');
    assert.equal(STATUS_AUDIENCE_DEFAULT_EMOJI, '\u2b50');
});
