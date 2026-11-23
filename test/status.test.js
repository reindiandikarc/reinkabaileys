import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    STATUS_NOTIFICATION_TYPES,
    STATUS_AUDIENCE_DEFAULT_EMOJI,
    STATUS_AUDIENCE_DEFAULT_LIST_NAME,
    STATUS_EXPIRY_SECONDS,
    StatusLinkType,
    STICKER_DEFAULT_AREA,
    makeStatusMentionMessage,
    makeStatusAddYoursAssociation,
    makeMessageAssociation,
    makeStatusAudienceMetadata,
    makeStatusNotificationMessage,
    makeGroupStatusReactionMessage,
    makeGroupStatusAttribution,
    makeNewsletterStatusAttribution,
    prepareModernMessageContent,
    linkSticker,
    locationSticker,
    channelSticker,
    normalizeStickers,
    readStickers,
    STICKER_DEFAULT_AREA as DEFAULT_AREA
} from '../src/index.js';

const KEY = { remoteJid: 'status@broadcast', fromMe: false, id: 'ABC123', participant: '628111111111@s.whatsapp.net' };

test('status-exports', () => {
    assert.equal(typeof STATUS_NOTIFICATION_TYPES, 'object');
    assert.equal(STATUS_NOTIFICATION_TYPES.STATUS_GROUP_STATUS_REPLY, 4);
    assert.equal(STATUS_AUDIENCE_DEFAULT_EMOJI, '\u2b50');
    assert.equal(STATUS_AUDIENCE_DEFAULT_LIST_NAME, 'Close friends');
    assert.equal(typeof STATUS_EXPIRY_SECONDS, 'number');
    assert.equal(typeof StatusLinkType, 'object');
    assert.equal(DEFAULT_AREA, STICKER_DEFAULT_AREA);
    assert.equal(STICKER_DEFAULT_AREA.x, 0.25);
    for (const value of [
        makeStatusMentionMessage,
        makeStatusAddYoursAssociation,
        makeMessageAssociation,
        makeStatusAudienceMetadata,
        makeStatusNotificationMessage,
        makeGroupStatusReactionMessage,
        makeGroupStatusAttribution,
        makeNewsletterStatusAttribution,
        prepareModernMessageContent,
        linkSticker,
        locationSticker,
        channelSticker,
        normalizeStickers,
        readStickers
    ]) {
        assert.equal(typeof value, 'function');
    }
});

test('status-associations-and-mentions', () => {
    const addYours = makeStatusAddYoursAssociation({ key: KEY });
    assert.equal(addYours.associationType, 8);
    assert.deepEqual({ ...addYours.parentMessageKey }, KEY);
    assert.equal(makeStatusAddYoursAssociation(KEY).associationType, 8);
    assert.equal(makeStatusAddYoursAssociation({ key: KEY, type: 'STATUS_ADD_YOURS_AI_IMAGINE' }).associationType, 15);
    assert.throws(() => makeStatusAddYoursAssociation({}), TypeError);

    assert.equal(makeMessageAssociation({ key: KEY }).associationType, 0);
    assert.equal(makeMessageAssociation({ parentMessageKey: KEY, type: 'STATUS_QUESTION' }).associationType, 16);
    assert.equal(makeMessageAssociation({ parentMessageKey: KEY, type: 'STATUS_QUESTION', messageIndex: 2 }).messageIndex, 2);

    const mention = makeStatusMentionMessage({ key: KEY });
    assert.deepEqual(Object.keys(mention), ['statusMentionMessage']);
    assert.equal(mention.statusMentionMessage.message.protocolMessage.type, 25);
    assert.deepEqual({ ...mention.statusMentionMessage.message.protocolMessage.key }, KEY);
    const group = makeStatusMentionMessage({ key: KEY, group: true });
    assert.deepEqual(Object.keys(group), ['groupStatusMentionMessage']);
    assert.throws(() => makeStatusMentionMessage({}), /statusMention\.key must be an object/);
});

test('status-audience-and-notification', () => {
    const audience = makeStatusAudienceMetadata({});
    assert.equal(audience.listName, STATUS_AUDIENCE_DEFAULT_LIST_NAME);
    assert.equal(audience.listEmoji, STATUS_AUDIENCE_DEFAULT_EMOJI);
    assert.equal(audience.audienceType, 1);
    assert.equal(makeStatusAudienceMetadata('Besties').listName, 'Besties');
    assert.equal(makeStatusAudienceMetadata({ audienceType: 'UNKNOWN' }).audienceType, 0);
    assert.throws(() => makeStatusAudienceMetadata(42), TypeError);

    const notification = makeStatusNotificationMessage({
        responseMessageKey: KEY,
        originalMessageKey: KEY,
        type: 'STATUS_GROUP_STATUS_REPLY'
    });
    assert.equal(notification.statusNotificationMessage.type, 4);
    assert.deepEqual({ ...notification.statusNotificationMessage.responseMessageKey }, KEY);
    assert.throws(() => makeStatusNotificationMessage({}), /responseMessageKey must be an object/);

    const prepared = prepareModernMessageContent({ text: 'halo', statusAudience: 'Besties' });
    assert.equal(prepared.contextInfo.statusAudienceMetadata.listName, 'Besties');
    assert.throws(
        () => prepareModernMessageContent({ statusMention: { key: KEY }, addYours: KEY }),
        /addYours cannot be combined with statusMention/
    );
});

test('status-attributions-and-reactions', () => {
    const groupReaction = makeGroupStatusReactionMessage({ key: KEY, text: '\u2764\ufe0f' });
    assert.deepEqual(Object.keys(groupReaction), ['groupStatusMessageV2']);
    const reaction = groupReaction.groupStatusMessageV2.message.reactionMessage;
    assert.equal(reaction.text, '\u2764\ufe0f');
    assert.deepEqual({ ...reaction.key }, KEY);

    const group = makeGroupStatusAttribution({ authorJid: '628111111111@s.whatsapp.net' });
    assert.equal(group.type, 5);
    assert.equal(group.groupStatus.authorJid, '628111111111@s.whatsapp.net');
    assert.throws(() => makeGroupStatusAttribution({}), /authorJid is required/);

    const channel = makeNewsletterStatusAttribution({ newsletterJid: '123@newsletter', messageId: 4 });
    assert.equal(channel.type, 9);
    assert.equal(channel.statusReshare.metadata.channelJid, '123@newsletter');
    assert.equal(channel.statusReshare.metadata.channelMessageId, 4);
    assert.throws(() => makeNewsletterStatusAttribution({}), /newsletterJid is required/);
});

test('status-stickers', () => {
    const link = linkSticker({ url: 'https://example.com' });
    assert.equal(link.statusLinkType, StatusLinkType.RASTERIZED_LINK_PREVIEW);
    assert.equal(link.polygonVertices.length, 4);
    assert.equal(link.tapAction.tapUrl, 'https://example.com');

    const location = locationSticker({ latitude: 1, longitude: 2 });
    assert.equal(location.location.degreesLatitude, 1);
    assert.equal(location.location.degreesLongitude, 2);

    const channel = channelSticker({ jid: '123@newsletter', name: 'Saluran' });
    assert.equal(channel.newsletter.newsletterJid, '123@newsletter');
    assert.equal(channel.newsletter.newsletterName, 'Saluran');

    const normalized = normalizeStickers([link]);
    assert.equal(normalized.length, 1);
    assert.equal(normalized[0].statusLinkType, StatusLinkType.RASTERIZED_LINK_PREVIEW);
    assert.equal(normalized[0].tapAction.tapUrl, 'https://example.com');
    assert.equal(typeof readStickers, 'function');
});
