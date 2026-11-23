import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    USERNAME_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_PIN_LENGTH,
    UsernameValidationError,
    validateUsername,
    isUsernamePin,
    displayUsername,
    stripUsernamePrefix,
    getBotJid,
    USyncQuery,
    USyncUser,
    USyncUsernameProtocol,
    USyncContactProtocol
} from '../src/index.js';

test('username-exports', () => {
    assert.equal(USERNAME_MIN_LENGTH, 3);
    assert.equal(USERNAME_MAX_LENGTH, 35);
    assert.equal(USERNAME_PIN_LENGTH, 4);
    assert.equal(typeof UsernameValidationError, 'object');
    for (const value of [validateUsername, isUsernamePin, displayUsername, stripUsernamePrefix, getBotJid]) {
        assert.equal(typeof value, 'function');
    }
    for (const value of [USyncQuery, USyncUser, USyncUsernameProtocol, USyncContactProtocol]) {
        assert.equal(typeof value, 'function');
    }
});

test('username-validation', () => {
    assert.equal(validateUsername('rexx').isValid, true);
    assert.equal(validateUsername('@rexx').isValid, true);
    assert.equal(validateUsername('re_xx.1').isValid, true);
    assert.equal(validateUsername('ab').isValid, false);
    assert.equal(validateUsername('ab').errorType, UsernameValidationError.INVALID_LENGTH);
    assert.equal(validateUsername('1234').errorType, UsernameValidationError.INVALID_NO_LETTERS);
    assert.equal(validateUsername('.rexx').errorType, UsernameValidationError.INVALID_PERIODS);
    assert.equal(validateUsername('rexx..dua').errorType, UsernameValidationError.INVALID_PERIODS);
    assert.equal(validateUsername('www.rexx').errorType, UsernameValidationError.INVALID_WWW_PREFIX);
    assert.equal(validateUsername('rexx.com').errorType, UsernameValidationError.INVALID_DOMAIN_SUFFIX);
    assert.equal(validateUsername('whatsapp1').errorType, UsernameValidationError.INVALID_WORD);
    assert.equal(validateUsername('rexx!').errorType, UsernameValidationError.INVALID_CHARACTER);
    assert.equal(validateUsername(123).isValid, false);
    assert.equal(isUsernamePin('1234'), true);
    assert.equal(isUsernamePin('12'), false);
    assert.equal(isUsernamePin(1234), false);
});

test('username-display-and-jid-helpers', () => {
    assert.equal(stripUsernamePrefix('@rexx'), 'rexx');
    assert.equal(stripUsernamePrefix('rexx'), 'rexx');
    assert.equal(displayUsername('rexx'), '@rexx');
    assert.equal(displayUsername('@rexx'), '@rexx');
    assert.equal(getBotJid('867051314767696@bot'), '13135550002@s.whatsapp.net');
    assert.equal(getBotJid('tidakdikenal@bot'), 'tidakdikenal@bot');
    assert.equal(getBotJid('628111111111@s.whatsapp.net'), '628111111111@s.whatsapp.net');
});

test('usync-username-query-nodes', () => {
    const query = new USyncQuery().withUsernameProtocol();
    query.withUser(new USyncUser().withId('628111111111@s.whatsapp.net'));
    const protocol = query.protocols[0];
    assert.ok(protocol instanceof USyncUsernameProtocol);
    assert.deepEqual(protocol.getQueryElement(), { tag: 'username', attrs: {} });
    assert.equal(protocol.getUserElement(query.users[0]), null);
});

test('usync-username-reverse-parse', () => {
    const query = new USyncQuery().withUsernameProtocol();
    query.withUser(new USyncUser().withId('628111111111@s.whatsapp.net'));
    query.withUser(new USyncUser().withId('628222222222@s.whatsapp.net'));
    const result = {
        tag: 'iq',
        attrs: { type: 'result' },
        content: [{ tag: 'usync', attrs: {}, content: [{ tag: 'list', attrs: {}, content: [
            { tag: 'user', attrs: { jid: '628111111111@s.whatsapp.net' }, content: [{ tag: 'username', attrs: {}, content: 'rexx' }] },
            { tag: 'user', attrs: { jid: '628222222222@s.whatsapp.net' }, content: [{ tag: 'username', attrs: {}, content: 'elaina' }] }
        ] }] }]
    };
    const parsed = query.parseUSyncQueryResult(result);
    const mapped = parsed.list
        .filter(entry => typeof entry.username === 'string' && entry.username.length > 0)
        .map(({ username, id }) => ({ jid: id, username }));
    assert.deepEqual(mapped, [
        { jid: '628111111111@s.whatsapp.net', username: 'rexx' },
        { jid: '628222222222@s.whatsapp.net', username: 'elaina' }
    ]);
});

test('usync-contact-username-nodes', () => {
    const query = new USyncQuery().withContactProtocol();
    query.withUser(new USyncUser().withUsername('rexx').withUsernameKey('1234'));
    query.withUser(new USyncUser().withUsername('elaina'));
    const protocol = query.protocols[0];
    assert.ok(protocol instanceof USyncContactProtocol);
    assert.deepEqual(protocol.getUserElement(query.users[0]), { tag: 'contact', attrs: { username: 'rexx', pin: '1234' } });
    assert.deepEqual(protocol.getUserElement(query.users[1]), { tag: 'contact', attrs: { username: 'elaina' } });
});
