#!/usr/bin/env python3
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, 'node_modules', '@whiskeysockets', 'baileys')
if not os.path.isdir(BASE) and os.path.isfile(os.path.join(ROOT, 'src', 'index.bundle.cjs')):
    BASE = ROOT
BUNDLE = os.path.join(BASE, 'src', 'index.bundle.cjs')
ESM = os.path.join(BASE, 'src', 'Utils', 'messages.js')
MARK = 'ALYA_SOUND_STICKER_PATCH'
MARK_V2 = 'ALYA_SOUND_STICKER_V2_PATCH'


def read(path):
    with open(path, 'r', encoding='utf-8') as handle:
        return handle.read()


def write(path, text):
    temp = path + '.stcaudio.tmp'
    with open(temp, 'w', encoding='utf-8') as handle:
        handle.write(text)
    os.replace(temp, path)


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit('ANCHOR %s count=%d' % (label, count))
    return text.replace(old, new, 1)


def apply_once(text, old, new, label):
    if new in text:
        return text
    return replace_once(text, old, new, label)


def marker_counts():
    targets = {
        os.path.join(BASE, 'src', 'index.bundle.cjs'): [
            'ALYA_V13_RVO_PATCH',
            'ALYA_V13_EARLY_RVO_PATCH',
        ],
        os.path.join(BASE, 'src', 'Utils', 'decode-wa-message.js'): [
            'ALYA_V13_RVO_PATCH',
        ],
        os.path.join(BASE, 'src', 'Socket', 'messages-recv.js'): [
            'ALYA_V13_EARLY_RVO_PATCH',
        ],
    }
    counts = {}
    for path, markers in targets.items():
        text = read(path)
        for marker in markers:
            counts[(path, marker)] = text.count(marker)
    return counts


def check_markers_unchanged(before):
    after = marker_counts()
    if before != after:
        raise SystemExit('RVO MARKERS CHANGED: %s -> %s' % (before, after))
    return after


def patch_field26(text):
    if 'StickerMessage.prototype.audioMessage = null;' not in text:
        text = replace_once(
            text,
            '      StickerMessage.prototype.mediaKeyDomain = null;\n      let $oneOfFields2;',
            '      StickerMessage.prototype.mediaKeyDomain = null;\n'
            '      StickerMessage.prototype.audioMessage = null;\n'
            '      let $oneOfFields2;',
            'bundle proto property'
        )
    text = apply_once(
        text,
        '      StickerMessage.prototype.mediaKeyDomain = null;\n'
        '      StickerMessage.prototype.audioMessage = null;\n'
        '      let $oneOfFields2;',
        '      StickerMessage.prototype.mediaKeyDomain = null;\n'
        '      StickerMessage.prototype.audioMessage = null;\n'
        '      let $oneOfFields2;\n'
        '      let $oneOfFieldsStickerAudio;',
        'bundle proto oneof var'
    )
    old_oneof = (
        '        get: $util.oneOfGetter($oneOfFields2 = ["audioMessage"]),\n'
        '        set: $util.oneOfSetter($oneOfFields2)'
    )
    new_oneof = (
        '        get: $util.oneOfGetter($oneOfFieldsStickerAudio = ["audioMessage"]),\n'
        '        set: $util.oneOfSetter($oneOfFieldsStickerAudio)'
    )
    if old_oneof in text:
        text = text.replace(old_oneof, new_oneof, 1)
    elif 'Object.defineProperty(StickerMessage.prototype, "_audioMessage", {' not in text:
        text = replace_once(
            text,
            '      Object.defineProperty(StickerMessage.prototype, "_mediaKeyDomain", {\n'
            '        get: $util.oneOfGetter($oneOfFields2 = ["mediaKeyDomain"]),\n'
            '        set: $util.oneOfSetter($oneOfFields2)\n'
            '      });\n'
            '      StickerMessage.create = function create(properties) {',
            '      Object.defineProperty(StickerMessage.prototype, "_mediaKeyDomain", {\n'
            '        get: $util.oneOfGetter($oneOfFields2 = ["mediaKeyDomain"]),\n'
            '        set: $util.oneOfSetter($oneOfFields2)\n'
            '      });\n'
            '      Object.defineProperty(StickerMessage.prototype, "_audioMessage", {\n'
            '        get: $util.oneOfGetter($oneOfFieldsStickerAudio = ["audioMessage"]),\n'
            '        set: $util.oneOfSetter($oneOfFieldsStickerAudio)\n'
            '      });\n'
            '      StickerMessage.create = function create(properties) {',
            'bundle proto oneof'
        )
    text = apply_once(
        text,
        '        if (m.mediaKeyDomain != null && Object.hasOwnProperty.call(m, "mediaKeyDomain"))\n'
        '          w.uint32(184).int32(m.mediaKeyDomain);\n'
        '        return w;\n'
        '      };\n'
        '      StickerMessage.decode = function decode(r, l, e) {',
        '        if (m.mediaKeyDomain != null && Object.hasOwnProperty.call(m, "mediaKeyDomain"))\n'
        '          w.uint32(184).int32(m.mediaKeyDomain);\n'
        '        if (m.audioMessage != null && Object.hasOwnProperty.call(m, "audioMessage"))\n'
        '          $root.proto.Message.AudioMessage.encode(m.audioMessage, w.uint32(210).fork()).ldelim();\n'
        '        return w;\n'
        '      };\n'
        '      StickerMessage.decode = function decode(r, l, e) {',
        'bundle proto encode'
    )
    text = apply_once(
        text,
        '            case 23: {\n'
        '              m.mediaKeyDomain = r.int32();\n'
        '              break;\n'
        '            }\n'
        '            default:\n'
        '              r.skipType(t & 7);',
        '            case 23: {\n'
        '              m.mediaKeyDomain = r.int32();\n'
        '              break;\n'
        '            }\n'
        '            case 26: {\n'
        '              m.audioMessage = $root.proto.Message.AudioMessage.decode(r, r.uint32());\n'
        '              break;\n'
        '            }\n'
        '            default:\n'
        '              r.skipType(t & 7);',
        'bundle proto decode'
    )
    text = apply_once(
        text,
        '          case "BOT":\n'
        '          case 4:\n'
        '            m.mediaKeyDomain = 4;\n'
        '            break;\n'
        '        }\n'
        '        return m;\n'
        '      };\n'
        '      StickerMessage.toObject = function toObject(m, o) {',
        '          case "BOT":\n'
        '          case 4:\n'
        '            m.mediaKeyDomain = 4;\n'
        '            break;\n'
        '        }\n'
        '        if (d.audioMessage != null) {\n'
        '          if (typeof d.audioMessage !== "object")\n'
        '            throw TypeError(".proto.audioMessage: object expected");\n'
        '          m.audioMessage = $root.proto.Message.AudioMessage.fromObject(d.audioMessage);\n'
        '        }\n'
        '        return m;\n'
        '      };\n'
        '      StickerMessage.toObject = function toObject(m, o) {',
        'bundle proto fromObject'
    )
    text = apply_once(
        text,
        '        if (m.mediaKeyDomain != null && m.hasOwnProperty("mediaKeyDomain")) {\n'
        '          d.mediaKeyDomain = o.enums === String ? $root.proto.Message.MediaKeyDomain[m.mediaKeyDomain] === void 0 ? m.mediaKeyDomain : $root.proto.Message.MediaKeyDomain[m.mediaKeyDomain] : m.mediaKeyDomain;\n'
        '          if (o.oneofs)\n'
        '            d._mediaKeyDomain = "mediaKeyDomain";\n'
        '        }\n'
        '        return d;\n'
        '      };\n'
        '      StickerMessage.prototype.toJSON = function toJSON() {',
        '        if (m.mediaKeyDomain != null && m.hasOwnProperty("mediaKeyDomain")) {\n'
        '          d.mediaKeyDomain = o.enums === String ? $root.proto.Message.MediaKeyDomain[m.mediaKeyDomain] === void 0 ? m.mediaKeyDomain : $root.proto.Message.MediaKeyDomain[m.mediaKeyDomain] : m.mediaKeyDomain;\n'
        '          if (o.oneofs)\n'
        '            d._mediaKeyDomain = "mediaKeyDomain";\n'
        '        }\n'
        '        if (m.audioMessage != null && m.hasOwnProperty("audioMessage")) {\n'
        '          d.audioMessage = $root.proto.Message.AudioMessage.toObject(m.audioMessage, o);\n'
        '          if (o.oneofs)\n'
        '            d._audioMessage = "audioMessage";\n'
        '        }\n'
        '        return d;\n'
        '      };\n'
        '      StickerMessage.prototype.toJSON = function toJSON() {',
        'bundle proto toObject'
    )
    return text


def patch_field134(text):
    text = apply_once(
        text,
        '    Message.prototype.pollResultSnapshotMessageV3 = null;\n'
        '    let $oneOfFields;',
        '    Message.prototype.pollResultSnapshotMessageV3 = null;\n'
        '    Message.prototype.audioStickerMessage = null;\n'
        '    let $oneOfFields;\n'
        '    let $oneOfFieldsSound;',
        'bundle field134 property'
    )
    text = apply_once(
        text,
        '    Object.defineProperty(Message.prototype, "_pollResultSnapshotMessageV3", {\n'
        '      get: $util.oneOfGetter($oneOfFields = ["pollResultSnapshotMessageV3"]),\n'
        '      set: $util.oneOfSetter($oneOfFields)\n'
        '    });\n'
        '    Message.create = function create(properties) {',
        '    Object.defineProperty(Message.prototype, "_pollResultSnapshotMessageV3", {\n'
        '      get: $util.oneOfGetter($oneOfFields = ["pollResultSnapshotMessageV3"]),\n'
        '      set: $util.oneOfSetter($oneOfFields)\n'
        '    });\n'
        '    Object.defineProperty(Message.prototype, "_audioStickerMessage", {\n'
        '      get: $util.oneOfGetter($oneOfFieldsSound = ["audioStickerMessage"]),\n'
        '      set: $util.oneOfSetter($oneOfFieldsSound)\n'
        '    });\n'
        '    Message.create = function create(properties) {',
        'bundle field134 oneof'
    )
    text = apply_once(
        text,
        '      if (m.pollResultSnapshotMessageV3 != null && Object.hasOwnProperty.call(m, "pollResultSnapshotMessageV3"))\n'
        '        $root.proto.Message.PollResultSnapshotMessage.encode(m.pollResultSnapshotMessageV3, w.uint32(914).fork()).ldelim();\n'
        '      return w;\n'
        '    };\n'
        '    Message.decode = function decode(r, l, e) {',
        '      if (m.pollResultSnapshotMessageV3 != null && Object.hasOwnProperty.call(m, "pollResultSnapshotMessageV3"))\n'
        '        $root.proto.Message.PollResultSnapshotMessage.encode(m.pollResultSnapshotMessageV3, w.uint32(914).fork()).ldelim();\n'
        '      if (m.audioStickerMessage != null && Object.hasOwnProperty.call(m, "audioStickerMessage"))\n'
        '        $root.proto.Message.FutureProofMessage.encode(m.audioStickerMessage, w.uint32(1074).fork()).ldelim();\n'
        '      return w;\n'
        '    };\n'
        '    Message.decode = function decode(r, l, e) {',
        'bundle field134 encode'
    )
    text = apply_once(
        text,
        '          case 114: {\n'
        '            m.pollResultSnapshotMessageV3 = $root.proto.Message.PollResultSnapshotMessage.decode(r, r.uint32());\n'
        '            break;\n'
        '          }\n'
        '          default:\n'
        '            r.skipType(t & 7);',
        '          case 114: {\n'
        '            m.pollResultSnapshotMessageV3 = $root.proto.Message.PollResultSnapshotMessage.decode(r, r.uint32());\n'
        '            break;\n'
        '          }\n'
        '          case 134: {\n'
        '            m.audioStickerMessage = $root.proto.Message.FutureProofMessage.decode(r, r.uint32());\n'
        '            break;\n'
        '          }\n'
        '          default:\n'
        '            r.skipType(t & 7);',
        'bundle field134 decode'
    )
    text = apply_once(
        text,
        '      if (d.pollResultSnapshotMessageV3 != null) {\n'
        '        if (typeof d.pollResultSnapshotMessageV3 !== "object")\n'
        '          throw TypeError(".proto.Message.pollResultSnapshotMessageV3: object expected");\n'
        '        m.pollResultSnapshotMessageV3 = $root.proto.Message.PollResultSnapshotMessage.fromObject(d.pollResultSnapshotMessageV3);\n'
        '      }\n'
        '      return m;\n'
        '    };\n'
        '    Message.toObject = function toObject(m, o) {',
        '      if (d.pollResultSnapshotMessageV3 != null) {\n'
        '        if (typeof d.pollResultSnapshotMessageV3 !== "object")\n'
        '          throw TypeError(".proto.Message.pollResultSnapshotMessageV3: object expected");\n'
        '        m.pollResultSnapshotMessageV3 = $root.proto.Message.PollResultSnapshotMessage.fromObject(d.pollResultSnapshotMessageV3);\n'
        '      }\n'
        '      if (d.audioStickerMessage != null) {\n'
        '        if (typeof d.audioStickerMessage !== "object")\n'
        '          throw TypeError(".proto.Message.audioStickerMessage: object expected");\n'
        '        m.audioStickerMessage = $root.proto.Message.FutureProofMessage.fromObject(d.audioStickerMessage);\n'
        '      }\n'
        '      return m;\n'
        '    };\n'
        '    Message.toObject = function toObject(m, o) {',
        'bundle field134 fromObject'
    )
    text = apply_once(
        text,
        '      if (m.pollResultSnapshotMessageV3 != null && m.hasOwnProperty("pollResultSnapshotMessageV3")) {\n'
        '        d.pollResultSnapshotMessageV3 = $root.proto.Message.PollResultSnapshotMessage.toObject(m.pollResultSnapshotMessageV3, o);\n'
        '        if (o.oneofs)\n'
        '          d._pollResultSnapshotMessageV3 = "pollResultSnapshotMessageV3";\n'
        '      }\n'
        '      return d;\n'
        '    };\n'
        '    Message.prototype.toJSON = function toJSON() {',
        '      if (m.pollResultSnapshotMessageV3 != null && m.hasOwnProperty("pollResultSnapshotMessageV3")) {\n'
        '        d.pollResultSnapshotMessageV3 = $root.proto.Message.PollResultSnapshotMessage.toObject(m.pollResultSnapshotMessageV3, o);\n'
        '        if (o.oneofs)\n'
        '          d._pollResultSnapshotMessageV3 = "pollResultSnapshotMessageV3";\n'
        '      }\n'
        '      if (m.audioStickerMessage != null && m.hasOwnProperty("audioStickerMessage")) {\n'
        '        d.audioStickerMessage = $root.proto.Message.FutureProofMessage.toObject(m.audioStickerMessage, o);\n'
        '        if (o.oneofs)\n'
        '          d._audioStickerMessage = "audioStickerMessage";\n'
        '      }\n'
        '      return d;\n'
        '    };\n'
        '    Message.prototype.toJSON = function toJSON() {',
        'bundle field134 toObject'
    )
    return text


def patch_prep(text):
    if MARK not in text:
        text = replace_once(
            text,
            'var prepareWAMessageMedia = async (message, options) => {\n  const logger = options.logger;',
            'var prepareWAMessageMediaBase = async (message, options) => {\n  const logger = options.logger;',
            'bundle prep rename'
        )
        wrapper = (
            'var prepareWAMessageMedia = async (message, options) => {\n'
            '  const ' + MARK + ' = true;\n'
            '  const ' + MARK_V2 + ' = true;\n'
            '  const stickerAudio = message.stickerAudio;\n'
            '  const baseMessage = { ...message };\n'
            '  delete baseMessage.stickerAudio;\n'
            '  const obj = await prepareWAMessageMediaBase(baseMessage, options);\n'
            '  if (stickerAudio && obj.stickerMessage) {\n'
            '    const audioOptions = { ...options };\n'
            '    delete audioOptions.mediaTypeOverride;\n'
            '    const prepared = stickerAudio && typeof stickerAudio === "object" && Object.prototype.hasOwnProperty.call(stickerAudio, "mediaKey")\n'
            '      ? stickerAudio\n'
            '      : (await prepareWAMessageMediaBase({ audio: stickerAudio, ptt: true }, audioOptions)).audioMessage;\n'
            '    if (prepared) {\n'
            '      obj.stickerMessage.audioMessage = prepared;\n'
            '    }\n'
            '  }\n'
            '  return obj;\n'
            '};\n'
        )
        text = replace_once(
            text,
            '  if (cacheableKey) {\n'
            '    logger?.debug({ cacheableKey }, "set cache");\n'
            '    await options.mediaCache.set(cacheableKey, proto.Message.encode(obj).finish());\n'
            '  }\n'
            '  return obj;\n'
            '};\n'
            'var prepareDisappearingMessageSettingContent = (ephemeralExpiration) => {',
            '  if (cacheableKey) {\n'
            '    logger?.debug({ cacheableKey }, "set cache");\n'
            '    await options.mediaCache.set(cacheableKey, proto.Message.encode(obj).finish());\n'
            '  }\n'
            '  return obj;\n'
            '};\n' + wrapper +
            'var prepareDisappearingMessageSettingContent = (ephemeralExpiration) => {',
            'bundle prep wrapper'
        )
    elif MARK_V2 not in text:
        text = replace_once(
            text,
            '  const ' + MARK + ' = true;\n',
            '  const ' + MARK + ' = true;\n  const ' + MARK_V2 + ' = true;\n',
            'bundle v2 marker'
        )
    return text


def patch_scoped(text, start_marker, end_marker, patcher, label):
    start = text.find(start_marker)
    if start == -1:
        raise SystemExit('BLOCK START %s not found' % label)
    end = text.find(end_marker, start)
    if end == -1:
        raise SystemExit('BLOCK END %s not found' % label)
    block_end = end + len(end_marker)
    patched = patcher(text[start:block_end])
    return text[:start] + patched + text[block_end:]


def patch_bundle(text):
    text = patch_scoped(
        text,
        '    Message.StickerMessage = (function() {',
        '      return StickerMessage;\n    })();',
        patch_field26,
        'StickerMessage'
    )
    text = patch_scoped(
        text,
        '  proto2.Message = (function() {',
        '    return Message;\n  })();',
        patch_field134,
        'Message'
    )
    return patch_prep(text)


def patch_esm(text):
    if MARK in text:
        return text
    text = replace_once(
        text,
        "export const prepareWAMessageMedia = async (message, options) => {\n    const logger = options.logger;",
        "const prepareWAMessageMediaBase = async (message, options) => {\n    const logger = options.logger;",
        'esm prep rename'
    )
    wrapper = (
        'export const prepareWAMessageMedia = async (message, options) => {\n'
        '    const ' + MARK + ' = true;\n'
        '    const stickerAudio = message.stickerAudio;\n'
        '    const baseMessage = { ...message };\n'
        '    delete baseMessage.stickerAudio;\n'
        '    const obj = await prepareWAMessageMediaBase(baseMessage, options);\n'
        '    if (stickerAudio && obj.stickerMessage) {\n'
        '        const audioOptions = { ...options };\n'
        '        delete audioOptions.mediaTypeOverride;\n'
        '        const prepared = stickerAudio && typeof stickerAudio === "object" && Object.prototype.hasOwnProperty.call(stickerAudio, "mediaKey")\n'
        '            ? stickerAudio\n'
        '            : (await prepareWAMessageMediaBase({ audio: stickerAudio, ptt: true }, audioOptions)).audioMessage;\n'
        '        if (prepared) {\n'
        '            obj.stickerMessage.audioMessage = prepared;\n'
        '        }\n'
        '    }\n'
        '    return obj;\n'
        '};\n'
    )
    text = replace_once(
        text,
        '    if (cacheableKey) {\n'
        "        logger?.debug({ cacheableKey }, 'set cache');\n"
        '        await options.mediaCache.set(cacheableKey, WAProto.Message.encode(obj).finish());\n'
        '    }\n'
        '    return obj;\n'
        '};\n'
        'export const prepareDisappearingMessageSettingContent = (ephemeralExpiration) => {',
        '    if (cacheableKey) {\n'
        "        logger?.debug({ cacheableKey }, 'set cache');\n"
        '        await options.mediaCache.set(cacheableKey, WAProto.Message.encode(obj).finish());\n'
        '    }\n'
        '    return obj;\n'
        '};\n' + wrapper +
        'export const prepareDisappearingMessageSettingContent = (ephemeralExpiration) => {',
        'esm prep wrapper'
    )
    return text


def main():
    for path in (BUNDLE, ESM):
        if not os.path.isfile(path):
            raise SystemExit('MISSING ' + path)

    bundle_before = read(BUNDLE)
    esm_before = read(ESM)
    if MARK_V2 in bundle_before and MARK in esm_before:
        print('SKIP ' + MARK_V2)
        print('MARKERS=' + str(marker_counts()))
        print('PATCHED_FILES=0')
        return

    before = marker_counts()
    patched_bundle = patch_bundle(bundle_before)
    patched_esm = patch_esm(esm_before)
    changed = 0
    if patched_bundle != bundle_before:
        write(BUNDLE, patched_bundle)
        changed += 1
    if patched_esm != esm_before:
        write(ESM, patched_esm)
        changed += 1
    after = check_markers_unchanged(before)
    print('PATCHED ' + MARK_V2)
    print('MARKERS=' + str(after))
    print('PATCHED_FILES=%d' % changed)


if __name__ == '__main__':
    main()
