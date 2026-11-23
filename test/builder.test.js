import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    MessageBuilder,
    MB,
    MESSAGE_BUILDER_VERSION,
    Button,
    ButtonV2,
    Carousel,
    AIRich,
    Toolkit,
    AIRichError,
    ItemNotFoundError,
    DuplicateIdError,
    InvalidTargetError,
    ContentValidationError
} from '../src/index.js';

const JID = '628111111111@s.whatsapp.net';
const client = {
    waUploadToServer: async () => ({}),
    relayMessage: async () => ({})
};

test('builder-exports', () => {
    assert.equal(typeof MessageBuilder, 'object');
    assert.equal(MB, MessageBuilder);
    assert.equal(typeof MESSAGE_BUILDER_VERSION, 'string');
    assert.equal(MessageBuilder.VERSION, MESSAGE_BUILDER_VERSION);
    assert.equal(MessageBuilder.Button, Button);
    assert.equal(MessageBuilder.ButtonV2, ButtonV2);
    assert.equal(MessageBuilder.Carousel, Carousel);
    assert.equal(MessageBuilder.AIRich, AIRich);
    assert.equal(MessageBuilder.Toolkit, Toolkit);
    for (const name of ['Button', 'ButtonV2', 'Carousel', 'AIRich', 'Toolkit']) {
        assert.equal(typeof MessageBuilder[name], 'function', name);
    }
    for (const error of [AIRichError, ItemNotFoundError, DuplicateIdError, InvalidTargetError, ContentValidationError]) {
        assert.equal(typeof error, 'function');
        assert.equal(new error('x') instanceof Error, true);
    }
});

test('builder-layouts-and-toolkit', () => {
    assert.deepEqual(AIRich.newLayout('Single', { title: 'halo' }), {
        __typename: 'GenAIUnifiedResponseSection',
        view_model: {
            primitive: { title: 'halo' },
            __typename: 'GenAISingleLayoutViewModel'
        }
    });
    assert.deepEqual(Toolkit.extractIE('halo'), {
        text: 'halo',
        ie: [],
        inline_entities: []
    });
    const error = new ContentValidationError('bad', { field: 'title' });
    assert.equal(error.name, 'ContentValidationError');
    assert.equal(error.code, 'CONTENT_VALIDATION');
    assert.equal(error.field, 'title');
});

test('builder-button-chain', async () => {
    const button = new MessageBuilder.Button(client);
    assert.equal(button.setTitle('Judul'), button);
    button.setSubtitle('Subjudul').setBody('Isi pesan').setFooter('Pilih');
    button.addReply('Oke', 'ok').addButton('quick_reply', { display_text: 'Ya' });
    assert.equal(button._title, 'Judul');
    assert.equal(button._body, 'Isi pesan');

    const message = await button.build(JID, { messageId: 'BTN-1' });
    assert.equal(message.key.remoteJid, JID);
    assert.equal(message.key.id, 'BTN-1');
    assert.equal(message.message.interactiveMessage.body.text, 'Isi pesan');
    assert.equal(message.message.interactiveMessage.footer.text, 'Pilih');
    assert.equal(message.message.interactiveMessage.header.title, 'Judul');
    assert.equal(message.message.interactiveMessage.nativeFlowMessage.buttons.length, 2);
    assert.equal(message.message.interactiveMessage.nativeFlowMessage.buttons[0].name, 'quick_reply');
});

test('builder-button-v2-chain', async () => {
    const button = new MB.ButtonV2(client).setBody('Isi').setFooter('Kaki');
    assert.equal(button.addButton('Oke', 'ok'), button);
    button.addRawButton({ buttonId: 'dua', buttonText: { displayText: 'Dua' }, type: 1 });
    assert.throws(() => button.addRawButton([]), TypeError);

    const message = await button.build(JID, { messageId: 'BTN-2' });
    assert.equal(message.key.id, 'BTN-2');
    assert.equal(message.message.buttonsMessage.contentText, 'Isi');
    assert.equal(message.message.buttonsMessage.footerText, 'Kaki');
    assert.deepEqual(message.message.buttonsMessage.buttons.map(entry => entry.buttonId), ['ok', 'dua']);
});

test('builder-carousel-chain', () => {
    const card = {
        header: { hasMediaAttachment: true },
        body: { text: 'Kartu satu' },
        footer: { text: 'Kaki' },
        nativeFlowMessage: { buttons: [] }
    };
    const carousel = new MessageBuilder.Carousel(client).setBody('Karousel');
    assert.equal(carousel.addCard(card), carousel);
    assert.throws(() => new Carousel(client).addCard({ header: {} }), /must include an image or video/);

    const message = carousel.build(JID, { messageId: 'CR-1' });
    assert.equal(message.key.id, 'CR-1');
    assert.equal(message.message.interactiveMessage.body.text, 'Karousel');
    assert.equal(message.message.interactiveMessage.carouselMessage.cards.length, 1);
    assert.equal(message.message.interactiveMessage.carouselMessage.cards[0].body.text, 'Kartu satu');
});
