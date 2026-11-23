import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    ActiveCall,
    VoipClient,
    AudioFeeder,
    VideoFeeder,
    CallState,
    VIDEO_FORMAT_I420,
    CALL_AUDIO_PREFIX,
    CALL_VIDEO_PREFIX,
    makeVoipClient,
    getCallStatusFromNode,
    normalizeVoiceText,
    matchVoiceWakePhrase,
    removeVoiceWakePhrase,
    TTLCache
} from '../src/index.js';

test('voip-exports', () => {
    for (const value of [ActiveCall, VoipClient, AudioFeeder, VideoFeeder, makeVoipClient, getCallStatusFromNode]) {
        assert.equal(typeof value, 'function');
    }
    assert.equal(typeof normalizeVoiceText, 'function');
    assert.equal(typeof matchVoiceWakePhrase, 'function');
    assert.equal(typeof removeVoiceWakePhrase, 'function');
    assert.equal(typeof CallState, 'object');
    assert.equal(Object.isFrozen(CallState), true);
    assert.equal(CallState.Active, 6);
    assert.equal(VIDEO_FORMAT_I420, 0);
    assert.equal(typeof CALL_AUDIO_PREFIX, 'string');
    assert.equal(typeof CALL_VIDEO_PREFIX, 'string');
    assert.equal(typeof TTLCache, 'function');
});

test('voip-active-call', () => {
    const ended = [];
    const calls = [];
    const engine = {
        endCall(...args) { calls.push(['endCall', ...args]); },
        setMute(value) { calls.push(['setMute', value]); }
    };
    const call = new ActiveCall('CALL-1', engine, 0);
    call.on('ended', reason => ended.push(reason));
    assert.equal(call.callId, 'CALL-1');
    assert.equal(call.state, CallState.Idle);
    assert.equal(call.enqueue(['a.mp3', 'b.mp3']), 2);
    assert.equal(call.queued(), 2);
    assert.equal(call.nowPlaying(), null);
    assert.equal(call.play('c.mp3'), false);
    assert.equal(call.isVideo(), false);
    assert.throws(() => call.startScreenShare(), /needs a video call/);

    call._video = true;
    assert.equal(call.isVideo(), true);
    assert.equal(call.enqueueVideo(['d.mp4']), 1);
    assert.equal(call.queuedVideo(), 1);
    assert.equal(call.queued(), 1);

    call.mute(true);
    assert.deepEqual(calls[0], ['setMute', true]);
    call.end();
    assert.deepEqual(ended, ['local_end']);
    assert.deepEqual(calls[1], ['endCall', 0, true]);
    call.end();
    assert.equal(ended.length, 1);
});

test('voip-feeders', () => {
    const samples = [];
    const audio = new AudioFeeder(16000, 1, 320, chunk => samples.push(chunk));
    assert.equal(audio.queuedChunks, 0);
    assert.equal(typeof audio.stop, 'function');
    assert.deepEqual(new AudioFeeder(16000, 1, 320, () => {}, './voice.mp3')._resolveInputArgs(), ['-re', '-i', './voice.mp3']);

    const frames = [];
    const video = new VideoFeeder(4, 4, 10, frame => frames.push(frame));
    assert.equal(video._frameBytes, 24);
    assert.equal(video.queuedFrames, 0);
    assert.equal(Number.isInteger(new VideoFeeder(321, 241, 30, () => {})._frameBytes), true);
    assert.deepEqual(new VideoFeeder(4, 4, 10, () => {}, './clip.mp4')._resolveInputArgs(), ['-re', '-i', './clip.mp4']);
    assert.equal(frames.length, 0);
});

test('voip-voice-recognition-helpers', () => {
    assert.equal(normalizeVoiceText('Hai, Elaina-Baileys!'), 'hai elaina baileys');
    assert.equal(matchVoiceWakePhrase('Hai Elaina Baileys tolong buka menu', ['hai elaina-baileys']).phrase, 'hai elaina-baileys');
    assert.equal(matchVoiceWakePhrase('Besok kita pergi', ['hai elaina']), null);
    assert.equal(removeVoiceWakePhrase('Hai Elaina Baileys tolong buka menu', 'hai elaina baileys'), 'tolong buka menu');
});

test('voip-client-guards', async () => {
    assert.equal(getCallStatusFromNode({ tag: 'call', attrs: {} }), 'ringing');
    await assert.rejects(() => new VoipClient({}).connect(), /socket you are already logged in with/);
    await assert.rejects(() => new VoipClient({ socket: {} }).connect(), /no websocket yet/);
    await assert.rejects(() => makeVoipClient(null), /socket you are already logged in with/);
});
