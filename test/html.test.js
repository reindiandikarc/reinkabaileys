import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    HTML_APP_BRIDGE,
    HTML_APP_BYTE_BUDGET,
    HTML_APP_BYTE_LIMIT,
    HTML_APP_MESSAGE_CEILING,
    HTML_MIME_TYPE,
    AI_RICH_HTML_PRIMITIVE,
    checkHtmlApp,
    wireBytes,
    htmlSection,
    htmlMedia,
    dataUri,
    lockHeight,
    autoHeight,
    a2uiText,
    a2uiColumn,
    a2uiCard,
    a2uiSurface,
    a2uiFallback,
    a2uiWidget,
    sendHtmlApp,
    sendHtmlDocument
} from '../src/index.js';

test('html-exports', () => {
    assert.equal(HTML_APP_BRIDGE, 'AndroidBridge');
    assert.equal(HTML_MIME_TYPE, 'text/html');
    assert.equal(HTML_APP_BYTE_LIMIT, HTML_APP_BYTE_BUDGET);
    assert.equal(typeof HTML_APP_BYTE_BUDGET, 'number');
    assert.ok(HTML_APP_MESSAGE_CEILING > HTML_APP_BYTE_BUDGET);
    assert.equal(typeof AI_RICH_HTML_PRIMITIVE, 'string');
    for (const name of ['checkHtmlApp', 'wireBytes', 'htmlSection', 'htmlMedia', 'dataUri', 'lockHeight', 'autoHeight', 'a2uiText', 'a2uiColumn', 'a2uiCard', 'a2uiSurface', 'a2uiFallback', 'a2uiWidget', 'sendHtmlApp', 'sendHtmlDocument']) {
        const value = { checkHtmlApp, wireBytes, htmlSection, htmlMedia, dataUri, lockHeight, autoHeight, a2uiText, a2uiColumn, a2uiCard, a2uiSurface, a2uiFallback, a2uiWidget, sendHtmlApp, sendHtmlDocument }[name];
        assert.equal(typeof value, 'function', name);
    }
});

test('html-check-clean-page', () => {
    const report = checkHtmlApp('<html><body>halo dunia</body></html>', { height: 120 });
    assert.equal(report.ok, true);
    assert.deepEqual(report.problems, []);
    assert.equal(report.bytes, Buffer.byteLength('<html><body>halo dunia</body></html>', 'utf-8'));
    assert.equal(report.wireBytes, wireBytes('<html><body>halo dunia</body></html>'));
    assert.equal(checkHtmlApp('<html><body>halo</body></html>').warnings.some(warning => /no height settled/.test(warning)), true);
    assert.throws(() => checkHtmlApp(null), TypeError);
});

test('html-check-blocks-dead-webview-apis', () => {
    const report = checkHtmlApp('<script>fetch("https://example.com"); localStorage.setItem("a", "b");</script><img src="https://example.com/a.png">', { height: 100 });
    assert.equal(report.ok, false);
    assert.equal(report.problems.some(problem => /remote subresource/.test(problem)), true);
    assert.equal(report.problems.some(problem => /HTTP stack/.test(problem)), true);
    assert.equal(report.problems.some(problem => /localStorage/.test(problem)), true);

    const loop = checkHtmlApp('<script>setInterval(function(){}, 1000)</script>', { height: 100 });
    assert.equal(loop.ok, false);
    assert.equal(loop.problems.some(problem => /animation or timer loop/.test(problem)), true);
});

test('html-wire-bytes', () => {
    assert.equal(wireBytes('abc'), 5);
    assert.equal(wireBytes('h\u00e9llo'), 12);
    assert.ok(wireBytes('h\u00e9llo') > Buffer.byteLength('h\u00e9llo', 'utf-8'));
});

test('html-media-and-sections', () => {
    assert.equal(dataUri(Buffer.from('hi'), 'text/plain'), 'data:text/plain;base64,aGk=');
    assert.throws(() => dataUri(Buffer.from('hi'), 'invalid'), TypeError);
    assert.throws(() => dataUri(Buffer.alloc(0), 'text/plain'), TypeError);

    const video = htmlMedia(Buffer.from('data'), { mimetype: 'video/mp4', id: 'vid1' });
    assert.match(video, /^<video id="vid1" controls preload="none"/);
    assert.ok(video.includes('data:video/mp4;base64,ZGF0YQ=='));
    assert.ok(video.includes('id="vid1_go"'));
    assert.throws(() => htmlMedia(Buffer.from('x'), { mimetype: 'video/mp4', tag: 'iframe' }), TypeError);
    assert.throws(() => htmlMedia(Buffer.from('x'), { mimetype: 'video/mp4', id: '1bad' }), TypeError);

    const section = htmlSection('<b>halo</b>', { height: 120 });
    assert.equal(section.view_model.__typename, 'GenAISingleLayoutViewModel');
    assert.equal(section.view_model.primitive.__typename, AI_RICH_HTML_PRIMITIVE);
    assert.equal(section.view_model.primitive.payload.includes('height:120px'), true);
    assert.equal(section.view_model.primitive.payload.includes('<b>halo</b>'), true);
    assert.throws(() => htmlSection(''), TypeError);

    assert.match(lockHeight(240), /height:240px/);
    assert.throws(() => lockHeight(0), TypeError);
    assert.match(autoHeight({ min: 60, max: 600 }), /AndroidBridge\.updateSize/);
    assert.throws(() => autoHeight({ min: 600, max: 60 }), TypeError);
});

test('html-a2ui-helpers', () => {
    const root = a2uiText('root', 'Halo');
    assert.deepEqual(root, { id: 'root', component: 'Text', text: 'Halo', variant: 'body' });
    assert.deepEqual(a2uiColumn('col', ['root']), { id: 'col', component: 'Column', children: ['root'] });
    assert.deepEqual(a2uiCard('card', 'root'), { id: 'card', component: 'Card', child: 'root' });
    assert.equal(a2uiFallback([root, { id: 'x', title: 'Judul' }]), 'Halo\nJudul');

    const surface = a2uiSurface([root], { surfaceId: 'card-1' });
    assert.equal(surface.version, 'v0.9');
    assert.equal(surface.createSurface.surfaceId, 'card-1');
    assert.equal(surface.createSurface.root, 'root');
    assert.throws(() => a2uiSurface([]), TypeError);

    const widget = a2uiWidget([root], { uuid: 'widget-1' });
    assert.equal(widget.type, 'im_a2ui');
    assert.equal(widget.uuid, 'widget-1');
    assert.equal(widget.fallback, 'Halo');
});
